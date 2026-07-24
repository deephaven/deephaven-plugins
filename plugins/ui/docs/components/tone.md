# Tone

Tones play short sounds to the user using the browser's [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API). The sound is synthesized natively in the browser from an oscillator, so no audio file needs to be transferred. Use tones to provide quick audio feedback, such as signaling that a long-running task has finished or that new data has arrived.

## Example

```python
from deephaven import ui

btn = ui.button(
    "Play tone",
    on_press=lambda: ui.tone("C5"),
    variant="primary",
)
```

## Notes

Tones are triggered using the method `ui.tone`. A note can be specified either by name (such as `"C4"`, `"F#3"`, or `"Bb5"`) or as a frequency in Hertz (such as `440`). Note names use scientific pitch notation, where `A4` is 440 Hz.

```python
from deephaven import ui


@ui.component
def note_buttons():
    return ui.button_group(
        ui.button("Note name", on_press=lambda: ui.tone("A4")),
        ui.button("Frequency", on_press=lambda: ui.tone(440)),
    )


my_note_buttons = note_buttons()
```

## Rests

Insert a pause into a sequence with `None`. A rest produces no sound but still
takes up its `duration`, so you can control the spacing between phrases
independently of the uniform `gap`. Give a rest its own length with a
`(None, duration)` tuple.

```python
from deephaven import ui

btn = ui.button(
    "Play with a pause",
    on_press=lambda: ui.tone(
        ["C5", (None, 0.4), "C5"],
        duration=0.15,
    ),
    variant="primary",
)
```

## Sequences

To play a melody, pass a list of notes. Each note plays in turn, separated by a short `gap`. By default every note uses the same `duration`, but you can give a note its own duration by passing a `(note, duration)` tuple. Durations and gaps are measured in seconds.

```python
from deephaven import ui

btn = ui.button(
    "Play scale",
    on_press=lambda: ui.tone(
        ["C4", "D4", "E4", "F4", "G4", "A4", "B4", ("C5", 0.5)],
        duration=0.15,
    ),
    variant="primary",
)
```

## Chords

To play notes simultaneously, group them in a nested list. Each nested list is a chord whose notes sound together. You can mix single notes and chords in the same sequence, and a chord can be given its own duration with a `(chord, duration)` tuple.

```python
from deephaven import ui

btn = ui.button(
    "Play chords",
    on_press=lambda: ui.tone(
        [
            ["C4", "E4", "G4"],
            ["F4", "A4", "C5"],
            (["G4", "B4", "D5"], 0.6),
        ],
        duration=0.4,
    ),
    variant="primary",
)
```

## Waveform and volume

The `waveform` option selects the oscillator shape: `"sine"` (the default), `"square"`, `"triangle"`, or `"sawtooth"`. The `gain` option sets the volume from `0` (silent) to `1` (loudest).

```python
from deephaven import ui

btn = ui.button(
    "Play buzzer",
    on_press=lambda: ui.tone("A3", waveform="sawtooth", gain=0.3),
    variant="primary",
)
```

## Playing a jingle

Combining chords, rests, and per-note durations lets you play a short jingle.
This example recreates the Deephaven outro sting: a single strum of an E major
chord, a pause, and then the same chord strummed several times to finish.

```python
from deephaven import ui

_CHORD = ["E4", "G#4", "B4", "E5"]

btn = ui.button(
    "Play jingle",
    on_press=lambda: ui.tone(
        [
            (_CHORD, 0.35),
            (None, 0.55),
            (_CHORD, 0.12),
            (_CHORD, 0.12),
            (_CHORD, 0.12),
            (_CHORD, 0.12),
            (_CHORD, 0.3),
        ],
        gap=0.06,
        waveform="triangle",
        gain=0.6,
    ),
    variant="primary",
)
```

## Autoplay restrictions

Browsers block audio until the user has interacted with the page. Playing a tone in response to a user action, such as pressing a button, works reliably. A tone triggered without a prior interaction, such as from a ticking table before the user has clicked anything, may not be audible until the user interacts with the page.

## Tone from table example

This example plays a tone from the latest update of a ticking table. Note that the tone must be triggered on the render thread, whereas the table listener may be fired from another thread. Therefore you must use the render queue to trigger the tone.

```python order=my_tone_table,_source
from deephaven import time_table
from deephaven import ui

_source = time_table("PT2S").update("X = i").tail(5)


@ui.component
def tone_table(t):
    render_queue = ui.use_render_queue()

    def listener_function(update, is_replay):
        render_queue(lambda: ui.tone("C5"))

    ui.use_table_listener(t, listener_function, [])
    return t


my_tone_table = tone_table(_source)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.ui.tone
```
