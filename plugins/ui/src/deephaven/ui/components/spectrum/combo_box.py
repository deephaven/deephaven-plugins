from typing import Literal

MenuTriggerAction = Literal["focus", "input", "manual"]
Align = Literal["start", "end"]
Direction = Literal["bottom", "top"]
LoadingState = Literal[
    "loading", "sorting", "loadingMore", "error", "idle", "filtering"
]
FormValue = Literal["key", "text"]
