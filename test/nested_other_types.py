from deephaven.plugin.json import Node


def check_matplotlib():
    try:
        import deephaven.plugin.matplotlib
    except ModuleNotFoundError as e:
        print('Expecting deephaven-plugin-matplotlib to be installed')
        raise e


def create():
    check_matplotlib()
    import matplotlib.pyplot as plt
    x = [0, 2, 4, 6]
    y = [1, 3, 4, 8]
    plt.plot(x, y)
    plt.xlabel('x values')
    plt.ylabel('y values')
    plt.title('plotted x and y values')
    plt.legend(['line 1'])
    return Node({
        'name': 'My Matplotlib figure',
        'figure': plt.gcf()
    })


output = create()
