from __future__ import annotations
from typing import Any, Dict, Literal, Union

InputType = Literal["text", "serach", "url", "tel", "email", "password"]

TextFieldType = Literal["text", "search", "url", "tel", "email", "password"]
TextFieldInputMode = Literal[
    "none", "text", "decimal", "numeric", "tel", "search", "email", "url"
]
TextFieldValidationState = Literal["valid", "invalid"]
NecessityIndicator = Literal["icon", "label"]

ContextualHelperVariant = Literal["help", "info"]

EncodingType = Literal[
    "application/x-www-form-urlencoded", "multipart/form-data", "text/plain"
]

HTTPMethods = Literal["get", "post", "dialog"]

Target = Literal["_self", "_blank", "_parent", "_top"]

AutoCompleteModes = Literal["on", "off"]
AutoCapitalizeModes = Literal["off", "none", "on", "sentences", "words", "characters"]

DialogTriggerTypes = Literal[
    "modal", "popover", "tray", "fullscreen", "fullscreenTakeover"
]
DialogTriggerMobileTypes = Literal["modal", "fullscreen", "fullscreenTakeover"]
