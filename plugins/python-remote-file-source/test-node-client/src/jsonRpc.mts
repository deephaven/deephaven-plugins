import type { ModuleName, PythonModuleSpecData } from './types.mjs';

interface JsonRpcRequestBase {
  jsonrpc: '2.0';
  id: string;
}

export interface JsonRpcFetchModuleRequest extends JsonRpcRequestBase {
  method: 'fetch_module';
  params: { module_name: ModuleName };
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
 * Get a JsonRpc success response message for a module spec to send to the server.
 * @param id The request ID.
 * @param spec The Python module spec data.
 * @param source Optional source code of the module.
 * @returns The JSON-RPC success response.
 */
function moduleSpecResponse(
  id: string,
  { name, isPackage, origin, subModuleSearchLocations }: PythonModuleSpecData,
  source?: string | null
): JsonRpcSuccess {
  return {
    jsonrpc: '2.0',
    id,
    result: {
      name,
      origin,
      is_package: isPackage,
      submodule_search_locations: subModuleSearchLocations,
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
  moduleSpecResponse,
};
