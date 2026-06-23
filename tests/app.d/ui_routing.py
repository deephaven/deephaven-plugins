from typing import Any

from deephaven import ui


@ui.component
def ui_use_path_component():
    """Displays the current path for e2e verification."""
    path = ui.use_path()
    abs_path = ui.use_path(absolute=True)

    return ui.panel(
        ui.flex(
            ui.text(f"path={path}"),
            ui.text(f"absolute_path={abs_path}"),
            direction="column",
        ),
        title="Use Path",
    )


@ui.component
def ui_use_navigate_component():
    """Has buttons that trigger navigation for e2e verification."""
    path = ui.use_path()
    navigate = ui.use_navigate()

    def go_dashboard(_event: Any):
        navigate("/dashboard")

    def go_settings_push(_event: Any):
        navigate("/settings", replace=False)

    def go_with_query(_event: Any):
        navigate("/page", query_params={"tab": ["1"]})

    def go_with_fragment(_event: Any):
        navigate(fragment="section-2")

    def clear_query(_event: Any):
        navigate(query_params="")

    return ui.panel(
        ui.flex(
            ui.text(f"current_path={path}"),
            ui.action_button("Go Dashboard", on_press=go_dashboard),
            ui.action_button("Go Settings (push)", on_press=go_settings_push),
            ui.action_button("Go with query", on_press=go_with_query),
            ui.action_button("Go with fragment", on_press=go_with_fragment),
            ui.action_button("Clear query", on_press=clear_query),
            direction="column",
        ),
        title="Use Navigate",
    )


@ui.component
def ui_link_to_component():
    """Has links with the `to` prop for e2e verification."""
    path = ui.use_path()
    return ui.panel(
        ui.flex(
            ui.text(f"current_path={path}"),
            ui.link("Go Home", to="/"),
            ui.link("Go Search", to="/search?q=hello#results"),
            ui.link(
                "Go Users",
                to={"path": "/users", "query_params": {"sort": "name"}},
            ),
            direction="column",
        ),
        title="Link To",
    )


@ui.component
def user_profile():
    params = ui.use_params()
    user_id = params.get("user_id", "unknown")
    return ui.text(f"user_id={user_id}")


@ui.component
def user_post():
    params = ui.use_params()
    user_id = params.get("user_id", "unknown")
    post_id = params.get("post_id", "unknown")
    return ui.text(f"user_id={user_id},post_id={post_id}")


@ui.component
def user_list():
    return ui.text("user_list")


@ui.component
def dashboard_home():
    return ui.text("dashboard_home")


@ui.component
def not_found():
    return ui.text("not_found")


@ui.component
def ui_router_component():
    """A router component for e2e verification."""
    return ui.panel(
        ui.router(
            ui.route(
                ui.route(index=True, element=user_list),
                ui.route(
                    ui.route(path="posts/{post_id}", element=user_post),
                    path="{user_id}",
                    element=user_profile,
                ),
                path="users",
            ),
            ui.route(index=True, element=dashboard_home),
            ui.route(path="*", element=not_found),
        ),
        title="Router",
    )


@ui.component
def ui_url_components_component():
    """Displays URL components for e2e verification."""
    url = ui.use_url_components()
    return ui.panel(
        ui.flex(
            ui.text(f"scheme={url.scheme}"),
            ui.text(f"netloc={url.netloc}"),
            ui.text(f"path={url.path}"),
            ui.text(f"query={url.query}"),
            ui.text(f"fragment={url.fragment}"),
            direction="column",
        ),
        title="URL Components",
    )


ui_use_path = ui_use_path_component()
ui_use_navigate = ui_use_navigate_component()
ui_link_to = ui_link_to_component()
ui_router = ui_router_component()
ui_url_components = ui_url_components_component()
