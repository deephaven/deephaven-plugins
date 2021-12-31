__version__ = "0.0.1.dev2"

def register_into(callback):
    register_object_types_into(callback)

def register_object_types_into(callback):
    from . import figure_type
    callback.register_object_type(figure_type.FigureType())
