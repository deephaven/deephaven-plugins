python_project_name = '{{ cookiecutter.python_project_name }}'

if not python_project_name.isidentifier():
    raise ValueError(f'{python_project_name} is not a valid Python project name')