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
