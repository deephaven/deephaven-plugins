import { ToastQueue } from '@deephaven/components';
import Log from '@deephaven/log';

const log = Log.module('Notification');

export const NOTIFICATION_EVENT = 'notification.event';

export type NotificationParams = {
  title: string;
  description?: string;
  icon?: string;
  tag?: string;
  silent?: boolean;
  onClick?: () => void;
  onClose?: () => void;
};

/**
 * Show the notification message as a toast. Used as a fallback when the
 * Notifications API is unavailable or permission has not been granted.
 *
 * @param params The notification event parameters
 */
function showToastFallback(params: NotificationParams): void {
  const { title, description, onClick } = params;
  const message = description != null ? `${title}: ${description}` : title;
  ToastQueue.info(
    message,
    onClick != null ? { actionLabel: 'View', onAction: onClick } : undefined
  );
}

/**
 * Handle a notification event by displaying a system notification using the
 * browser's Notifications API.
 *
 * If notifications are not supported or the user has denied permission, the
 * message is shown as a toast instead. If permission has not yet been requested,
 * it will be requested before displaying the notification.
 *
 * @param params The notification event parameters
 */
export async function showNotification(
  params: NotificationParams
): Promise<void> {
  const { title, description, icon, tag, silent, onClick, onClose } = params;

  if (typeof Notification === 'undefined') {
    log.warn('Notifications are not supported, falling back to a toast');
    showToastFallback(params);
    return;
  }

  let { permission } = Notification;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      log.warn('Error requesting notification permission', e);
      showToastFallback(params);
      return;
    }
  }

  if (permission !== 'granted') {
    log.debug('Notification permission not granted, falling back to a toast');
    showToastFallback(params);
    return;
  }

  const notification = new Notification(title, {
    body: description,
    icon,
    tag,
    silent,
  });

  if (onClick != null) {
    notification.onclick = () => {
      onClick();
    };
  }
  if (onClose != null) {
    notification.onclose = () => {
      onClose();
    };
  }
}

export default showNotification;
