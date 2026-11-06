import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

/**
 * The Host half of dsh-better-todo.
 *
 * It owns one JSON document on disk and serves it to the panel over
 * `/todo-panel/state`. The page cannot use localStorage or IndexedDB for this:
 * the desktop picks a fresh web port on every launch, so those databases sit
 * behind an origin that no longer exists after a restart. The route always
 * answers on the page's own origin, so the data survives restarts, port
 * changes, and a reinstall.
 */

const ROUTE_PREFIX = '/todo-panel';
const STATE_ROUTE = `${ROUTE_PREFIX}/state`;
const MAX_BODY_BYTES = 32 * 1024 * 1024;

/** `<DSH_HOME>/todo-panel/state.json`; falls back to `~/.dsh` outside a profile. */
function documentPath() {
  const home =
    typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME.trim() !== ''
      ? process.env.DSH_HOME.trim()
      : join(homedir(), '.dsh');
  return join(home, 'todo-panel', 'state.json');
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('the state document is larger than 32 MB'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

/** GETs carry no Origin; a POST from another page must not overwrite the file. */
function sameOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== 'string' || origin === '') return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch (error) {
    return false;
  }
}

export function apply(ctx) {
  const webServer = ctx.get('webServer');
  if (webServer === undefined) {
    console.warn('[todo-panel] web server service missing; the panel will not persist anything');
    return;
  }

  const file = documentPath();
  let writes = Promise.resolve(true);

  const readDocument = async () => {
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'));
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      // First run, or a file someone truncated: the panel starts empty.
      return null;
    }
  };

  const writeDocument = (document) => {
    // Serialise writes so two saves never interleave on the temporary file.
    writes = writes
      .then(async () => {
        await mkdir(dirname(file), { recursive: true });
        const temporary = `${file}.tmp`;
        await writeFile(temporary, JSON.stringify(document), 'utf8');
        await rename(temporary, file);
        return true;
      })
      .catch((error) => {
        console.error('[todo-panel] state could not be written:', String(error && error.message ? error.message : error));
        return false;
      });
    return writes;
  };

  const dispose = webServer.register({
    kind: 'prefix',
    path: ROUTE_PREFIX,
    handler: async (request, response) => {
      const method = request.method ?? 'GET';
      const path = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
        .pathname;
      if (path !== STATE_ROUTE) {
        sendJson(response, 404, { error: `no such route: ${path}` });
        return;
      }
      if (method === 'GET' || method === 'HEAD') {
        const document = await readDocument();
        sendJson(
          response,
          200,
          document ?? {
            version: 1,
            savedAt: null,
            open: true,
            items: [],
            position: null,
            pomodoro: null,
            attachments: {},
          },
        );
        return;
      }
      if (method === 'POST') {
        if (!sameOrigin(request)) {
          sendJson(response, 403, { error: 'cross-origin request refused' });
          return;
        }
        let document;
        try {
          document = JSON.parse(await readBody(request));
        } catch (error) {
          sendJson(response, 400, {
            error: String(error && error.message ? error.message : error),
          });
          return;
        }
        if (!document || typeof document !== 'object' || Array.isArray(document)) {
          sendJson(response, 400, { error: 'expected a state document' });
          return;
        }
        const stored = await writeDocument(document);
        sendJson(response, stored ? 200 : 500, { ok: stored });
        return;
      }
      sendJson(response, 405, { error: 'method not allowed' });
    },
  });

  ctx.effect(() => () => dispose(), 'todo-panel: state route');

  const tools = ctx.get('tools');
  if (tools === undefined) {
    console.warn('[todo-panel] tool registry missing; the agent cannot read the todo list');
    return;
  }

  /**
   * One entry of the panel, flattened for the model: the same fields the panel
   * shows, with the attachment reduced to its name and size because the data
   * URL would blow up the transcript.
   */
  const toToolItem = (item) => {
    const flat = {
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      detail: typeof item.detail === 'string' ? item.detail : '',
      due: typeof item.due === 'string' ? item.due : '',
      done: item.done === true,
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : '',
    };
    if (item.attachment && typeof item.attachment === 'object') {
      flat.attachment = {
        name: String(item.attachment.name ?? ''),
        size: Number(item.attachment.size) || 0,
      };
    }
    return flat;
  };

  const describeItems = (items) => {
    if (items.length === 0) return '待办列表是空的。';
    const lines = items.map((item, index) => {
      const parts = [`${index + 1}. [${item.done ? '已完成' : '未完成'}] ${item.title}`];
      if (item.due) parts.push(`截止 ${item.due.replace('T', ' ')}`);
      parts.push(`id ${item.id}`);
      let line = parts.join(' · ');
      if (item.detail) line += `\n   详情：${item.detail.replace(/\n/g, '\n   ')}`;
      if (item.attachment) line += `\n   附件：${item.attachment.name || '(未命名)'}`;
      return line;
    });
    return lines.join('\n');
  };

  ctx.effect(
    () =>
      tools.register({
        name: 'todo_list',
        description:
          "Read the user's Todo panel: the tasks kept by the dsh-better-todo plugin, with title, details, due time, completion state and attachment names. Call it whenever the user refers to their todos, asks what is due, or asks you to plan around them. This tool is read-only; it never changes the list.",
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            status: {
              type: 'string',
              enum: ['all', 'open', 'done'],
              description: 'Which tasks to return: all (default), open (not completed), or done.',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of tasks to return, 1-200. Defaults to 100.',
            },
          },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['total', 'open', 'done', 'items'],
            properties: {
              total: { type: 'integer' },
              open: { type: 'integer' },
              done: { type: 'integer' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['id', 'title', 'done'],
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    detail: { type: 'string' },
                    due: { type: 'string' },
                    done: { type: 'boolean' },
                    completedAt: { type: 'string' },
                    attachment: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['name', 'size'],
                      properties: {
                        name: { type: 'string' },
                        size: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          render: (args, value) => {
            const filter = typeof args.status === 'string' ? args.status : 'all';
            const label = filter === 'all' ? '全部' : filter === 'open' ? '未完成' : '已完成';
            const listed = Array.isArray(value.items) ? value.items.length : 0;
            const head = `Todo 面板预览（${label}）：下面列出 ${listed} 条；整个清单共 ${value.total} 条，其中未完成 ${value.open} 条，已完成 ${value.done} 条。`;
            return [
              {
                type: 'text',
                text: `${head}\n\n${describeItems(value.items)}`,
              },
            ];
          },
        },
        async execute(args) {
          const document = (await readDocument()) ?? { items: [] };
          const raw = Array.isArray(document.items) ? document.items : [];
          const all = raw.filter((item) => item && typeof item === 'object').map(toToolItem);
          const status = args && typeof args.status === 'string' ? args.status : 'all';
          const filtered = all.filter((item) =>
            status === 'open' ? !item.done : status === 'done' ? item.done : true,
          );
          const requested = Number(args && args.limit);
          const limit = Number.isFinite(requested) ? Math.min(200, Math.max(1, Math.round(requested))) : 100;
          return {
            total: all.length,
            open: all.filter((item) => !item.done).length,
            done: all.filter((item) => item.done).length,
            items: filtered.slice(0, limit),
          };
        },
        presentCall: (args) => ({
          card: 'generic',
          title: 'Read todo panel',
          kind: 'read',
          rawInput: args ?? {},
        }),
      }),
    'todo-panel: todo_list tool',
  );
}
