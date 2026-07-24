import Log from '@deephaven/log';

const log = Log.module('Tone');

export const TONE_EVENT = 'tone.event';

/** A pitch is either a note name like "C4" or a frequency in Hertz. */
export type Pitch = string | number;

/** One step of a tone sequence: a set of pitches played together for a duration. */
export type ToneStep = {
  notes: Pitch[];
  duration: number;
};

export type ToneParams = {
  notes: ToneStep[];
  gap: number;
  waveform: OscillatorType;
  gain: number;
};

/** Semitone offsets from C within an octave, keyed by note letter. */
const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const NOTE_NAME_RE = /^([A-Ga-g])([#b]?)(-?\d+)$/;

/**
 * Convert a note name like "C4", "F#3", or "Bb5" to its frequency in Hertz
 * using equal temperament with A4 = 440 Hz.
 *
 * @param name The note name to convert
 * @returns The frequency in Hertz
 */
export function noteNameToFrequency(name: string): number {
  const match = NOTE_NAME_RE.exec(name);
  if (match == null) {
    throw new Error(`Invalid note name: ${name}`);
  }
  const [, letter, accidental, octaveStr] = match;
  let semitone = NOTE_OFFSETS[letter.toUpperCase()];
  if (accidental === '#') {
    semitone += 1;
  } else if (accidental === 'b') {
    semitone -= 1;
  }
  const octave = parseInt(octaveStr, 10);
  // MIDI note number, where C-1 = 0 and A4 = 69.
  const midi = semitone + (octave + 1) * 12;
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Resolve a pitch (note name or frequency) to a frequency in Hertz.
 *
 * @param pitch The pitch to resolve
 * @returns The frequency in Hertz
 */
export function pitchToFrequency(pitch: Pitch): number {
  return typeof pitch === 'number' ? pitch : noteNameToFrequency(pitch);
}

let audioContext: AudioContext | null = null;

/**
 * Get the shared AudioContext, creating it lazily on first use. Returns null if
 * the Web Audio API is not available.
 */
function getAudioContext(): AudioContext | null {
  if (audioContext == null) {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctor == null) {
      return null;
    }
    audioContext = new Ctor();
  }
  return audioContext;
}

// Duration in seconds of the volume ramp applied at the start and end of each
// note to avoid audible clicks.
const RAMP_TIME = 0.008;

/**
 * Handle a tone event by playing the requested notes using the Web Audio API.
 *
 * Notes are scheduled sequentially, each starting after the previous note's
 * duration plus the configured gap. The pitches within a single step are played
 * simultaneously as a chord. A step with no pitches is a rest: it produces no
 * sound but still advances the schedule by its duration.
 *
 * @param params The tone event parameters
 */
export function playTone(params: ToneParams): void {
  const { notes, gap, waveform, gain } = params;

  const ctx = getAudioContext();
  if (ctx == null) {
    log.warn('Web Audio API is not supported; cannot play tone');
    return;
  }

  // Browsers start the AudioContext suspended until a user gesture; resume it so
  // tones triggered from an event handler are audible.
  if (ctx.state === 'suspended') {
    ctx.resume().catch(e => {
      log.warn('Unable to resume audio context', e);
    });
  }

  let startTime = ctx.currentTime;
  notes.forEach(step => {
    const { duration } = step;
    const endTime = startTime + duration;
    // Scale the gain so summing simultaneous oscillators does not clip.
    const stepGain = gain / Math.sqrt(Math.max(step.notes.length, 1));

    step.notes.forEach(pitch => {
      let frequency: number;
      try {
        frequency = pitchToFrequency(pitch);
      } catch (e) {
        log.warn('Skipping invalid pitch', pitch, e);
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Ramp the gain up and down to avoid clicks at the note boundaries.
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(
        stepGain,
        startTime + Math.min(RAMP_TIME, duration / 2)
      );
      gainNode.gain.setValueAtTime(
        stepGain,
        Math.max(startTime, endTime - RAMP_TIME)
      );
      gainNode.gain.linearRampToValueAtTime(0, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });

    startTime = endTime + gap;
  });
}

export default playTone;
