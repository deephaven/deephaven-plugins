import { noteNameToFrequency, pitchToFrequency, type ToneParams } from './Tone';

type MockOscillator = {
  type: OscillatorType;
  frequency: { setValueAtTime: jest.Mock };
  connect: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
};

type MockGain = {
  gain: {
    setValueAtTime: jest.Mock;
    linearRampToValueAtTime: jest.Mock;
  };
  connect: jest.Mock;
};

describe('noteNameToFrequency', () => {
  it.each([
    ['A4', 440],
    ['C4', 261.63],
    ['E4', 329.63],
    ['G#4', 415.3],
    ['Bb4', 466.16],
    ['A5', 880],
    ['A3', 220],
  ])('converts %s to ~%f Hz', (name, expected) => {
    expect(noteNameToFrequency(name)).toBeCloseTo(expected, 1);
  });

  it('throws on an invalid note name', () => {
    expect(() => noteNameToFrequency('H4')).toThrow();
  });
});

describe('pitchToFrequency', () => {
  it('passes numbers through as frequencies', () => {
    expect(pitchToFrequency(523.25)).toBe(523.25);
  });

  it('converts note names', () => {
    expect(pitchToFrequency('A4')).toBeCloseTo(440, 1);
  });
});

describe('playTone', () => {
  let oscillators: MockOscillator[];
  let gains: MockGain[];
  let mockContext: {
    currentTime: number;
    state: AudioContextState;
    destination: unknown;
    createOscillator: jest.Mock;
    createGain: jest.Mock;
    resume: jest.Mock;
  };

  const originalAudioContext = window.AudioContext;

  // playTone caches a module-level AudioContext singleton, so reset the module
  // registry before each test to get a fresh context and avoid leaking state
  // (such as the context's `state`) between tests.
  let playTone: typeof import('./Tone').playTone;

  beforeEach(() => {
    jest.resetModules();
    oscillators = [];
    gains = [];
    mockContext = {
      currentTime: 0,
      state: 'running',
      destination: {},
      createOscillator: jest.fn(() => {
        const osc: MockOscillator = {
          type: 'sine',
          frequency: { setValueAtTime: jest.fn() },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        };
        oscillators.push(osc);
        return osc;
      }),
      createGain: jest.fn(() => {
        const gain: MockGain = {
          gain: {
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
          },
          connect: jest.fn(),
        };
        gains.push(gain);
        return gain;
      }),
      resume: jest.fn().mockResolvedValue(undefined),
    };
    (window as { AudioContext: unknown }).AudioContext = jest.fn(
      () => mockContext
    );
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    playTone = require('./Tone').playTone;
  });

  afterEach(() => {
    (window as { AudioContext: unknown }).AudioContext = originalAudioContext;
    jest.clearAllMocks();
  });

  function play(params: Partial<ToneParams>): void {
    playTone({
      notes: [],
      gap: 0.05,
      waveform: 'sine',
      gain: 0.5,
      ...params,
    });
  }

  it('creates an oscillator for a single note', () => {
    play({ notes: [{ notes: ['A4'], duration: 0.2 }] });

    expect(oscillators).toHaveLength(1);
    expect(oscillators[0].type).toBe('sine');
    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(
      expect.closeTo(440, 1),
      0
    );
    expect(oscillators[0].start).toHaveBeenCalledWith(0);
    expect(oscillators[0].stop).toHaveBeenCalledWith(0.2);
  });

  it('schedules a sequence of notes back to back with a gap', () => {
    play({
      notes: [
        { notes: ['A4'], duration: 0.2 },
        { notes: ['C4'], duration: 0.3 },
      ],
      gap: 0.1,
    });

    expect(oscillators).toHaveLength(2);
    expect(oscillators[0].start).toHaveBeenCalledWith(0);
    expect(oscillators[0].stop).toHaveBeenCalledWith(0.2);
    // Second note starts after the first note's duration plus the gap.
    expect(oscillators[1].start).toHaveBeenCalledWith(expect.closeTo(0.3, 5));
    expect(oscillators[1].stop).toHaveBeenCalledWith(expect.closeTo(0.6, 5));
  });

  it('plays chord notes simultaneously with scaled gain', () => {
    play({
      notes: [{ notes: ['C4', 'E4', 'G4'], duration: 0.4 }],
      gain: 0.6,
    });

    expect(oscillators).toHaveLength(3);
    // All chord notes share the same start and stop time.
    oscillators.forEach(osc => {
      expect(osc.start).toHaveBeenCalledWith(0);
      expect(osc.stop).toHaveBeenCalledWith(0.4);
    });
    // Gain is scaled by 1/sqrt(3) so the summed chord does not clip.
    const expectedPeak = 0.6 / Math.sqrt(3);
    gains.forEach(gain => {
      expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(expectedPeak, 5),
        expect.any(Number)
      );
    });
  });

  it('uses the requested waveform', () => {
    play({ notes: [{ notes: ['A4'], duration: 0.2 }], waveform: 'square' });
    expect(oscillators[0].type).toBe('square');
  });

  it('treats a step with no notes as a silent rest that advances the schedule', () => {
    play({
      notes: [
        { notes: ['A4'], duration: 0.2 },
        { notes: [], duration: 0.5 },
        { notes: ['C4'], duration: 0.2 },
      ],
      gap: 0.1,
    });

    // The rest produces no oscillator, but the following note is delayed by the
    // rest's duration plus the surrounding gaps.
    expect(oscillators).toHaveLength(2);
    expect(oscillators[1].start).toHaveBeenCalledWith(expect.closeTo(0.9, 5));
    expect(oscillators[1].stop).toHaveBeenCalledWith(expect.closeTo(1.1, 5));
  });

  it('resumes a suspended audio context', () => {
    mockContext.state = 'suspended';
    play({ notes: [{ notes: ['A4'], duration: 0.2 }] });
    expect(mockContext.resume).toHaveBeenCalledTimes(1);
  });
});
