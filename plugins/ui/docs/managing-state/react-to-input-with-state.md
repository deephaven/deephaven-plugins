# React to Input with State

`deephaven.ui` offers a declarative approach to UI manipulation. Rather than directly altering individual UI elements, you define the various states your component can occupy and transition between them based on user input. This approach aligns with how designers conceptualize the UI.

## Declarative UI compared to imperative

When designing UI interactions, you likely consider how the UI should respond to user actions. Take, for example, a form that allows users to submit an answer:

- Typing into the form enables the “Submit” button.
- Pressing “Submit” disables both the form and the button, and displays a spinner.
- If the network request is successful, the form is hidden, and a “Thank you” message appears.
- If the network request fails, an error message is shown, and the form is re-enabled.

In imperative programming, you would implement these interactions by writing explicit instructions to manipulate the UI based on the events that occur. This is akin to giving step-by-step directions to someone driving a car.

They don't know your destination; they simply follow your commands. If you provide incorrect directions, you'll end up in the wrong place. This approach is called imperative because you must "command" each element, from the spinner to the button, instructing the computer on how to update the UI.

This Javascript example shows an html form coded in an imperative style:

```javascript
async function handleFormSubmit(e) {
  e.preventDefault();
  disable(textarea);
  disable(button);
  show(loadingMessage);
  hide(errorMessage);
  try {
    await submitForm(textarea.value);
    show(successMessage);
    hide(form);
  } catch (err) {
    show(errorMessage);
    errorMessage.textContent = err.message;
  } finally {
    hide(loadingMessage);
    enable(textarea);
    enable(button);
  }
}

function handleTextareaChange() {
  if (textarea.value.length === 0) {
    disable(button);
  } else {
    enable(button);
  }
}

function hide(el) {
  el.style.display = 'none';
}

function show(el) {
  el.style.display = '';
}

function enable(el) {
  el.disabled = false;
}

function disable(el) {
  el.disabled = true;
}

function submitForm(answer) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (answer.toLowerCase() === 'istanbul') {
        resolve();
      } else {
        reject(new Error('Good guess but a wrong answer. Try again!'));
      }
    }, 1500);
  });
}

let form = document.getElementById('form');
let textarea = document.getElementById('textarea');
let button = document.getElementById('button');
let loadingMessage = document.getElementById('loading');
let errorMessage = document.getElementById('error');
let successMessage = document.getElementById('success');
form.onsubmit = handleFormSubmit;
textarea.oninput = handleTextareaChange;
```

Imperatively manipulating the UI works for simple examples, but becomes increasingly difficult in complex systems. Imagine updating a page with multiple forms. Adding a new UI element or interaction would require meticulously checking all existing code to avoid bugs, such as forgetting to show or hide elements.

`deephaven.ui` addresses this issue.

In `deephaven.ui`, you do not manipulate the UI directly. Instead, you declare what you want to display, and `deephaven.ui` determines how to update the UI. It is like telling a taxi driver your destination instead of giving step-by-step directions. The driver knows the best route and possibly even shortcuts you had not considered.

# Think about UI declaratively

TODO this is the final thing

```python
from deephaven import ui
import threading


@ui.component
def form():
    answer, set_answer = ui.use_state("")
    error, set_error = ui.use_state(None)
    status, set_status = ui.use_state("typing")

    def submit_form(answer):
        should_error = answer != "3.14"
        if should_error:
            set_status("typing")
            set_error("Incorrect!")
        else:
            set_status("success")

    def handle_submit():
        set_status("submitting")
        threading.Timer(1.5, lambda: submit_form(answer)).start()

    if status == "success":
        return ui.heading("Correct!")

    return [
        ui.heading("Quiz"),
        ui.text("What are the first three digits of pi?"),
        ui.form(
            ui.text_area(
                value=answer, on_change=set_answer, is_disabled=status == "submitting"
            ),
            ui.button(
                "Submit",
                type="submit",
                is_disabled=len(answer) == 0 or status == "submitting",
            ),
            ui.text(error),
            on_submit=handle_submit,
        ),
    ]


form_example = form()
```
