/**
 * Model Context Protocol (MCP) Official Schema
 * This file contains TypeScript types for the MCP specification
 */

/* JSON-RPC types */
export type JSONRPCMessage =
  | JSONRPCRequest
  | JSONRPCNotification
  | JSONRPCResponse
  | JSONRPCError;

export const LATEST_PROTOCOL_VERSION = "2024-11-05";
export const JSONRPC_VERSION = "2.0";

export type ProgressToken = string | number;

export type Cursor = string;

export interface Request {
  method: string;
  params?: {
    _meta?: {
      /**
       * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
       */
      progressToken?: ProgressToken;
    };
    [key: string]: unknown;
  };
}

export interface Notification {
  method: string;
  params?: {
    /**
     * This parameter name is reserved by MCP to allow clients and servers to attach additional metadata to their notifications.
     */
    _meta?: { [key: string]: unknown };
    [key: string]: unknown;
  };
}

export interface Result {
  /**
   * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
   */
  _meta?: { [key: string]: unknown };
  [key: string]: unknown;
}

export type RequestId = string | number;

export interface JSONRPCRequest extends Request {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
}

export interface JSONRPCNotification extends Notification {
  jsonrpc: typeof JSONRPC_VERSION;
}

export interface JSONRPCResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  result: Result;
}

export interface JSONRPCError {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  error: {
    /**
     * The error type that occurred.
     */
    code: number;
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: string;
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data?: unknown;
  };
}

export type EmptyResult = Result;

export interface CancelledNotification extends Notification {
  method: "notifications/cancelled";
  params: {
    /**
     * The ID of the request to cancel.
     *
     * This MUST correspond to the ID of a request previously issued in the same direction.
     */
    requestId: RequestId;

    /**
     * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
     */
    reason?: string;
  };
}

export interface Tool {
  /**
   * The name of the tool.
   */
  name: string;
  /**
   * A human-readable description of the tool.
   */
  description?: string;
  /**
   * A JSON Schema object defining the expected parameters for the tool.
   */
  inputSchema: {
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
}

export interface CallToolRequest extends Request {
  method: "tools/call";
  params: {
    name: string;
    arguments?: { [key: string]: unknown };
  };
}

export interface CallToolResult extends Result {
  content: (TextContent | ImageContent | EmbeddedResource)[];

  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   */
  isError?: boolean;
}

export interface TextContent extends Annotated {
  type: "text";
  /**
   * The text content of the message.
   */
  text: string;
}

export interface ImageContent extends Annotated {
  type: "image";
  /**
   * The base64-encoded image data.
   *
   * @format byte
   */
  data: string;
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: string;
}

export interface Annotated {
  annotations?: {
    /**
     * Describes who the intended customer of this object or data is.
     * 
     * It can include multiple entries to indicate content useful for multiple audiences (e.g., `["user", "assistant"]`).
     */
    audience?: Role[];

    /**
     * Describes how important this data is for operating the server.
     * 
     * A value of 1 means "most important," and indicates that the data is
     * effectively required, while 0 means "least important," and indicates that
     * the data is entirely optional.
     *
     * @TJS-type number
     * @minimum 0
     * @maximum 1
     */
    priority?: number;
  }
}

export interface EmbeddedResource extends Annotated {
  type: "resource";
  resource: TextResourceContents | BlobResourceContents;
}

export interface TextResourceContents extends ResourceContents {
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: string;
}

export interface BlobResourceContents extends ResourceContents {
  /**
   * A base64-encoded string representing the binary data of the item.
   *
   * @format byte
   */
  blob: string;
}

export interface ResourceContents {
  /**
   * The URI of this resource.
   *
   * @format uri
   */
  uri: string;
  /**
   * The MIME type of this resource, if known.
   */
  mimeType?: string;
}

export type Role = "user" | "assistant"; 