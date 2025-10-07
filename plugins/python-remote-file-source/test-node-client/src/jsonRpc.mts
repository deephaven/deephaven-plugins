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
