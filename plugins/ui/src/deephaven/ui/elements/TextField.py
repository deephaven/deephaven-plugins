class TextField:
    def __init__(self, value, on_change, **props):
        self._value = value
        self._on_change = on_change
        self._props = props

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, new_value):
        self._value = new_value
        self._on_change(new_value)

    @property
    def props(self):
        return self._props
