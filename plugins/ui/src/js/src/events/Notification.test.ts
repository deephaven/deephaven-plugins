import { ToastQueue } from '@deephaven/components';
import { showNotification } from './Notification';

jest.mock('@deephaven/components', () => ({
  ToastQueue: {
    info: jest.fn(),
  },
}));

const mockToastInfo = ToastQueue.info as jest.Mock;

describe('showNotification', () => {
  const originalNotification = (globalThis as { Notification?: unknown })
    .Notification;

  function setNotification(value: unknown): void {
    (globalThis as { Notification?: unknown }).Notification = value;
  }

  /**
   * Create a mock Notification constructor with the given permission and
   * requestPermission behavior.
   */
  function createNotificationMock({
    permission = 'granted',
    requestPermission,
  }: {
    permission?: NotificationPermission;
    requestPermission?: jest.Mock;
  } = {}): jest.Mock & {
    permission: NotificationPermission;
    requestPermission: jest.Mock;
  } {
    const instances: Array<Record<string, unknown>> = [];
    const ctor = jest.fn((title: string, options?: NotificationOptions) => {
      const instance: Record<string, unknown> = {
        title,
        options,
        onclick: null,
        onclose: null,
      };
      instances.push(instance);
      return instance;
    }) as jest.Mock & {
      permission: NotificationPermission;
      requestPermission: jest.Mock;
      instances: Array<Record<string, unknown>>;
    };
    ctor.permission = permission;
    ctor.requestPermission =
      requestPermission ?? jest.fn().mockResolvedValue(permission);
    ctor.instances = instances;
    return ctor;
  }

  afterEach(() => {
    setNotification(originalNotification);
    jest.clearAllMocks();
  });

  it('displays a notification when permission is granted', async () => {
    const ctor = createNotificationMock({ permission: 'granted' });
    setNotification(ctor);

    await showNotification({
      title: 'Title',
      description: 'Body',
      icon: 'icon.png',
      tag: 'tag',
      silent: true,
    });

    expect(ctor).toHaveBeenCalledWith('Title', {
      body: 'Body',
      icon: 'icon.png',
      tag: 'tag',
      silent: true,
    });
    expect(mockToastInfo).not.toHaveBeenCalled();
  });

  it('wires onClick and onClose to the notification', async () => {
    const ctor = createNotificationMock({ permission: 'granted' });
    setNotification(ctor);
    const onClick = jest.fn();
    const onClose = jest.fn();

    await showNotification({ title: 'Title', onClick, onClose });

    const instance = ctor.mock.results[0].value as {
      onclick: () => void;
      onclose: () => void;
    };
    instance.onclick();
    instance.onclose();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('requests permission when not yet determined', async () => {
    const requestPermission = jest.fn().mockResolvedValue('granted');
    const ctor = createNotificationMock({
      permission: 'default',
      requestPermission,
    });
    setNotification(ctor);

    await showNotification({ title: 'Title' });

    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(ctor).toHaveBeenCalledWith('Title', expect.any(Object));
  });

  it('falls back to a toast when permission is denied', async () => {
    const ctor = createNotificationMock({ permission: 'denied' });
    setNotification(ctor);

    await showNotification({ title: 'Title', description: 'Body' });

    expect(ctor).not.toHaveBeenCalled();
    expect(mockToastInfo).toHaveBeenCalledWith('Title: Body', undefined);
  });

  it('exposes onClick as a toast action in the fallback', async () => {
    const ctor = createNotificationMock({ permission: 'denied' });
    setNotification(ctor);
    const onClick = jest.fn();

    await showNotification({ title: 'Title', onClick });

    expect(mockToastInfo).toHaveBeenCalledWith('Title', {
      actionLabel: 'View',
      onAction: onClick,
    });
  });

  it('falls back to a toast when notifications are not supported', async () => {
    setNotification(undefined);

    await showNotification({ title: 'Title', description: 'Body' });

    expect(mockToastInfo).toHaveBeenCalledWith('Title: Body', undefined);
  });
});
