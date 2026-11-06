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
}
