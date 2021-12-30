__version__ = "0.0.1.dev1"

def register_into(callback):
    register_custom_types_into(callback)

def register_custom_types_into(callback):
    from . import figure_type
    callback.register_custom_type(figure_type)
