from __future__ import annotations

import re

from ..hooks import use_send_event

from typing import Sequence, Union, cast
from .._internal.utils import dict_to_react_props
from .._internal.EventContext import NoContextException

_TONE_EVENT = "tone.event"

_WAVEFORMS = ("sine", "square", "triangle", "sawtooth")

# A single pitch: a note name like "C4" / "F#3" / "Bb5", or a frequency in Hertz.
Pitch = Union[str, float]

# One step of a tone sequence. It may be:
#   * a single pitch: "C4" or 440
#   * a chord (list of pitches played together): ["C4", "E4", "G4"]
#   * a rest (silence for the step's duration): None
#   * a (pitch_or_chord_or_rest, duration) tuple: ("C4", 0.4), (["C4", "E4"], 0.4),
#     or (None, 0.4)
Note = Union[
    Pitch,
    Sequence[Pitch],
    None,
    "tuple[Union[Pitch, Sequence[Pitch], None], float]",
]

# The value accepted by `tone`: either a single step, or a sequence of steps.
Notes = Union[Note, Sequence[Note]]

# Match a note name like "C4", "c#-1", "Bb10". Letter A-G, optional accidental
# (# or b), then an integer octave (may be negative).
_NOTE_NAME_RE = re.compile(r"^[A-Ga-g][#b]?-?\d+$")


class ToneException(NoContextException):
    pass


def _normalize_pitch(pitch: Pitch) -> str | float:
    """
    Validate a single pitch and return it in wire form.

    Args:
        pitch: A note name (e.g. "C4") or a frequency in Hertz.

    Returns:
        The validated pitch, unchanged.
    """
    if isinstance(pitch, bool):
        # bool is a subclass of int; reject it explicitly so `True`/`False`
        # are not silently treated as frequencies.
        raise ToneException(f"Invalid pitch: {pitch!r}")
    if isinstance(pitch, (int, float)):
        if pitch <= 0:
            raise ToneException(f"Frequency must be positive, got {pitch}")
        return pitch
    if isinstance(pitch, str) and _NOTE_NAME_RE.match(pitch):
        return pitch
    raise ToneException(
        f"Invalid pitch {pitch!r}. Use a note name like 'C4' or a positive "
        f"frequency in Hertz."
    )


def _normalize_step(step: Note, default_duration: float) -> dict:
    """
    Normalize a single step into wire form: a dict with a list of pitches and a
    duration.

    Args:
        step: A pitch, a chord (list of pitches), a rest (``None``), or a
            (pitch_or_chord_or_rest, duration) tuple.
        default_duration: The duration to use when the step does not specify one.

    Returns:
        A dict of the form ``{"notes": [pitch, ...], "duration": seconds}``. A
        rest is represented by an empty ``notes`` list.
    """
    duration = default_duration
    value: Note = step

    # A tuple is a (pitch_or_chord_or_rest, duration) pair.
    if isinstance(step, tuple):
        if len(step) != 2:
            raise ToneException(
                f"A (note, duration) step must have exactly 2 elements, got {step!r}"
            )
        value, duration = step
        if isinstance(duration, bool) or not isinstance(duration, (int, float)):
            raise ToneException(f"Duration must be a number, got {duration!r}")
        if duration <= 0:
            raise ToneException(f"Duration must be positive, got {duration}")

    # None is a rest: silence for the step's duration.
    if value is None:
        return {"notes": [], "duration": float(duration)}

    # A list is a chord (pitches played simultaneously); anything else is a
    # single pitch.
    if isinstance(value, list):
        if len(value) == 0:
            raise ToneException("A chord must contain at least one note")
        pitches = [_normalize_pitch(p) for p in value]
    else:
        pitches = [_normalize_pitch(cast(Pitch, value))]

    return {"notes": pitches, "duration": float(duration)}


def _normalize_notes(notes: Notes, default_duration: float) -> list[dict]:
    """
    Normalize the ``notes`` argument into a list of wire-form steps.

    A top-level ``list`` is treated as a sequence of steps, where each element is
    a single note, a chord (a nested list), or a (note, duration) tuple. Any
    other value is treated as a single step.

    Args:
        notes: The notes to play.
        default_duration: The duration to use for steps without an explicit one.

    Returns:
        A list of wire-form step dicts.
    """
    steps: Sequence[Note] = notes if isinstance(notes, list) else [notes]  # type: ignore[list-item]
    if len(steps) == 0:
        raise ToneException("`notes` must contain at least one note")
    return [_normalize_step(step, default_duration) for step in steps]


def tone(
    notes: Notes,
    *,
    duration: float = 0.2,
    gap: float = 0.05,
    waveform: str = "sine",
    gain: float = 0.5,
) -> None:
    """
    Plays one or more tones to the user using the browser's Web Audio API.

    Tones are synthesized natively in the browser from an oscillator, so no audio
    file is transferred. Provide a single note, a chord, or a sequence of notes to
    play a short melody or jingle.

    Args:
        notes: The note or notes to play. This may be:

            * A single note: a note name like ``"C4"`` or a frequency in Hertz
              like ``440``.
            * A chord: a list of notes played simultaneously, like
              ``["C4", "E4", "G4"]``.
            * A rest: ``None`` plays silence for the step's duration, which is
              useful for adding a pause between notes in a sequence.
            * A sequence: a list whose elements are single notes, chords (nested
              lists), rests (``None``), or ``(note, duration)`` tuples. For
              example ``["C4", ["E4", "G4"], (None, 0.5), ("C5", 0.5)]`` plays a
              note, then a chord, then a half-second rest, then a note held for
              half a second.
        duration: The default duration in seconds for a note that does not
            specify its own duration.
        gap: The silence in seconds inserted between successive notes in a
            sequence.
        waveform: The oscillator waveform to use. One of ``"sine"``, ``"square"``,
            ``"triangle"``, or ``"sawtooth"``.
        gain: The output volume, from ``0`` (silent) to ``1`` (loudest).

    Returns:
        None
    """
    if waveform not in _WAVEFORMS:
        raise ToneException(
            f"Invalid waveform {waveform!r}. Must be one of {', '.join(_WAVEFORMS)}."
        )
    if duration <= 0:
        raise ToneException(f"duration must be positive, got {duration}")
    if gap < 0:
        raise ToneException(f"gap must be non-negative, got {gap}")
    if not 0 <= gain <= 1:
        raise ToneException(f"gain must be between 0 and 1, got {gain}")

    params = dict_to_react_props(
        {
            "notes": _normalize_notes(notes, duration),
            "gap": gap,
            "waveform": waveform,
            "gain": gain,
        }
    )

    try:
        send_event = use_send_event()
    except NoContextException as e:
        raise ToneException(
            "Tones must be triggered from the render thread. Use the hook `use_render_queue` to queue a function on the render thread."
        ) from e
    send_event(_TONE_EVENT, params)
