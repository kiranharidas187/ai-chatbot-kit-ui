/**
 * Mock chat backend for the ChatKit demo — exercises all three built-in
 * transports. Run with `pnpm dev:server` (from the repo root or apps/demo).
 *
 *   POST /api/chat/sse   text/event-stream of ChatEvent JSON
 *   POST /api/chat       JSON { content } after a short delay
 *   WS   /api/chat/ws    bidirectional ChatEvent JSON (typing indicators etc.)
 *
 * Prompt tricks: include "tool" to see a simulated tool call, "think" for a
 * thinking block, "fail" to get an error event.
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = 8787;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildReply(userText) {
  return (
    `Here's a reply from the **mock server** to: “${userText}”.\n\n` +
    `It exercises markdown rendering:\n\n` +
    `- inline \`code\`\n` +
    `- a [link](https://example.com)\n\n` +
    '```ts\nconst answer = 42;\nconsole.log(answer);\n```\n\n' +
    `| transport | streaming |\n|---|---|\n| SSE | yes |\n| WebSocket | yes |\n| HTTP | no |`
  );
}

/** Yield the ChatEvents for one turn, honoring the prompt tricks. */
async function* turnEvents(userText) {
  if (/fail/i.test(userText)) {
    await sleep(600);
    yield { type: 'error', message: 'Mock backend failure (you asked for it!)', retryable: true };
    return;
  }
  if (/think/i.test(userText)) {
    for (const word of 'Let me reason about this step by step before answering…'.split(' ')) {
      await sleep(60);
      yield { type: 'thinking-delta', delta: word + ' ' };
    }
  }
  if (/tool/i.test(userText)) {
    await sleep(200);
    yield {
      type: 'tool-call-start',
      toolCallId: 'call-1',
      toolName: 'knowledge_search',
      input: { query: userText.slice(0, 60) },
    };
    await sleep(900);
    yield {
      type: 'tool-call-result',
      toolCallId: 'call-1',
      output: { results: 3, top: 'ChatKit architecture notes' },
    };
  }
  const reply = buildReply(userText);
  // Stream in small chunks rather than words so markdown fences arrive intact-ish.
  for (let i = 0; i < reply.length; i += 6) {
    await sleep(15);
    yield { type: 'text-delta', delta: reply.slice(i, i + 6) };
  }
  yield { type: 'done' };
}

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat/sse') {
    const body = await readBody(req);
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    for await (const event of turnEvents(body.message ?? '')) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    const body = await readBody(req);
    await sleep(800);
    if (/fail/i.test(body.message ?? '')) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Mock backend failure' }));
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ content: buildReply(body.message ?? '') }));
    return;
  }

  res.writeHead(404).end();
});

const wss = new WebSocketServer({ server, path: '/api/chat/ws' });
wss.on('connection', (socket) => {
  socket.on('message', async (raw) => {
    let payload;
    try {
      payload = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (payload?.type !== 'message') return;
    const sessionId = payload.sessionId;
    const send = (event) => socket.send(JSON.stringify({ sessionId, ...event }));

    send({ type: 'typing', active: true });
    await sleep(500);
    send({ type: 'typing', active: false });
    for await (const event of turnEvents(payload.message ?? '')) send(event);
  });
});

server.listen(PORT, () => {
  console.log(`mock chat backend listening on http://localhost:${PORT}`);
  console.log('  SSE:       POST /api/chat/sse');
  console.log('  HTTP:      POST /api/chat');
  console.log('  WebSocket: ws://localhost:8787/api/chat/ws');
});
