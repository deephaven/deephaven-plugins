export type ErrorNotificationPayload = {
  message: string;
  type: string;
  code: number;
};

export const METHOD_DOCUMENT_UPDATED = 'documentUpdated';

export const METHOD_DOCUMENT_ERROR = 'documentError';
