import { JSONRPCErrorResponse, isJSONRPCResponse } from "json-rpc-2.0";

export function isJSONRPCErrorResponse(obj: unknown): obj is JSONRPCErrorResponse {
  return obj != null && isJSONRPCResponse(obj) && obj.error !== undefined;
}

/**
 * Parse the error payload to get a user-friendly error message.
 * @param error Error payload to parse. Should be a JSON-RPC error response object, an Error object, or a string.
 * @returns A string of the error message to display to the user.
 */
export function parseServerErrorPayload(error: unknown): string {
  if (isJSONRPCErrorResponse(error)) {
    return error.error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }


  return 'An unknown error occurred.';
}