class TextField:
    def __init__(self, value, /, on_change):
        self._value = value
        self._on_change = on_change

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, new_value):
        self._value = new_value
        self._on_change(new_value)


def text_field(value, /, on_change):
    return TextField(value, on_change=on_change)


class Text:
    def __init__(self, value):
        self._value = value

    @property
    def value(self):
        return self._value


def text(value):
    return Text(value)
