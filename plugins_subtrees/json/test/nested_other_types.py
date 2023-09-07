from deephaven.plugin.json import Node
import matplotlib.pyplot as plt


def create():
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
