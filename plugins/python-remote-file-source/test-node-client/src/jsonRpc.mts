interface JsonRpcRequestBase {
  jsonrpc: '2.0';
  id: string;
}

export interface JsonRpcFetchModuleRequest extends JsonRpcRequestBase {
  method: 'fetch_module';
  params: { module_name: string };
}

export interface JsonRpcSetConnectionIdRequest extends JsonRpcRequestBase {
  method: 'set_connection_id';
}

export type JsonRpcRequest = JsonRpcFetchModuleRequest;

export interface JsonRpcSuccess {
  jsonrpc: '2.0';
  id: string;
  result: unknown;
}

export interface JsonRpcError {
  jsonrpc: '2.0';
  id: string;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError;

/**
 * Get a JsonRpc success response message to send module source to the server.
 * @param id The id of the request to respond to.
 * @param source The source code of the module, or undefined for no source.
 * @param filepath The path to the module source file (defaults to '<string>').
 * @returns A JsonRpc success response message.
 */
function moduleSourceResponse(
  id: string,
  source: string | undefined,
  filepath: string = '<string>'
): JsonRpcSuccess {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      filepath,
      source,
    },
  };
}

/**
 * Create a JsonRpc set_connection_id request message.
 * @param id The connection id to set.
 * @returns A JsonRpc set_connection_id request message.
 */
function setConnectionId(id: string): JsonRpcSetConnectionIdRequest {
  return {
    jsonrpc: '2.0',
    id,
    method: 'set_connection_id',
  };
}

export const Msg = {
  setConnectionId,
  moduleSourceResponse,
};
