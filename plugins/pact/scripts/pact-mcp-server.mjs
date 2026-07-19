import { createInterface } from 'node:readline';
import {
  MCP_TOOL_DEFINITIONS,
  RUNTIME_VERSION,
  createRuntimeState,
  executePactOperation,
} from '../runtime/pact-runtime.mjs';

let state = createRuntimeState();
const operationByTool = new Map(MCP_TOOL_DEFINITIONS.map(({ name, operation }) => [name, operation]));
const tools = MCP_TOOL_DEFINITIONS.map(({ operation: _operation, ...definition }) => definition);

function result(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }], structuredContent: payload };
}

function callTool(name, args = {}) {
  const operation = operationByTool.get(name);
  if (!operation) throw new Error(`Unknown tool: ${name}`);
  const executed = executePactOperation(state, operation, args);
  state = executed.state;
  return result(executed.result);
}

function respond(id, body) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`);
}

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); } catch { return; }
  if (message.id === undefined) return;
  try {
    if (message.method === 'initialize') {
      respond(message.id, { result: { protocolVersion: message.params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'pact-business-tools', version: RUNTIME_VERSION } } });
    } else if (message.method === 'ping') {
      respond(message.id, { result: {} });
    } else if (message.method === 'tools/list') {
      respond(message.id, { result: { tools } });
    } else if (message.method === 'tools/call') {
      respond(message.id, { result: callTool(message.params?.name, message.params?.arguments ?? {}) });
    } else {
      respond(message.id, { error: { code: -32601, message: `Method not found: ${message.method}` } });
    }
  } catch (error) {
    respond(message.id, { result: { content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }], isError: true } });
  }
});
