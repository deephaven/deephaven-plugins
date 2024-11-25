from deephaven import ui

my_modal = ui.panel(
    ui.dialog_trigger(
        ui.action_button(
            "Trigger Modal",
        ),
        ui.dialog(
            ui.heading("Modal"),
            ui.content("This is a modal."),
        ),
        is_dismissable=True,
        type="modal",
        default_open=True,
    )
)

my_popover = ui.panel(
    ui.dialog_trigger(
        ui.action_button(
            "Trigger Popover",
        ),
        ui.dialog(
            ui.heading("Popover"),
            ui.content("This is a popover."),
        ),
        type="popover",
        default_open=True,
    )
)

my_tray = ui.panel(
    ui.dialog_trigger(
        ui.action_button(
            "Trigger Tray",
        ),
        ui.dialog(
            ui.heading("Tray"),
            ui.content("This is a tray."),
        ),
        type="tray",
        default_open=True,
    )
)

my_fullscreen = ui.panel(
    ui.dialog_trigger(
        ui.action_button("Trigger Fullscreen"),
        ui.dialog(
            ui.heading("Fullscreen"),
            ui.content(
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin sit\
            amet tristique risus. In sit amet suscipit lorem. Orci varius\
            natoque penatibus et magnis dis parturient montes, nascetur\
            ridiculus mus. In condimentum imperdiet metus non condimentum. Duis\
            eu velit et quam accumsan tempus at id velit. Duis elementum\
            elementum purus, id tempus mauris posuere a. Nunc vestibulum sapien\
            pellentesque lectus commodo ornare."
            ),
        ),
        type="fullscreen",
        default_open=True,
    )
)


my_fullscreen_takeover = ui.panel(
    ui.dialog_trigger(
        ui.action_button("Trigger Fullscreen"),
        ui.dialog(
            ui.heading("Fullscreen"),
            ui.content(
                ui.form(
                    ui.text_field(label="Name"),
                    ui.text_field(label="Email address"),
                    ui.checkbox("Make profile private"),
                )
            ),
        ),
        type="fullscreenTakeover",
        default_open=True,
    )
)
