import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
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
const NOTIFY_ROUTE = `${ROUTE_PREFIX}/notify`;
const MAX_BODY_BYTES = 32 * 1024 * 1024;

/** `<DSH_HOME>/todo-panel/state.json`; falls back to `~/.dsh` outside a profile. */
function documentPath() {
  const home =
    typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME.trim() !== ''
      ? process.env.DSH_HOME.trim()
      : join(homedir(), '.dsh');
  return join(home, 'todo-panel', 'state.json');
}

/** The document a first run starts from, with every field the panel reads. */
function emptyDocument() {
  return {
    version: 1,
    rev: 0,
    savedAt: null,
    open: true,
    items: [],
    position: null,
    pomodoro: null,
    attachments: {},
  };
}

/** Older files predate `rev`; a missing or broken revision counts as revision 0. */
function documentRev(document) {
  const rev = Number(document && document.rev);
  return Number.isFinite(rev) ? Math.max(0, Math.trunc(rev)) : 0;
}

/** The stored value as a mutable document that has the collections tools use. */
function asDocument(value) {
  const document =
    value && typeof value === 'object' && !Array.isArray(value) ? value : emptyDocument();
  if (!Array.isArray(document.items)) document.items = [];
  if (
    !document.attachments ||
    typeof document.attachments !== 'object' ||
    Array.isArray(document.attachments)
  ) {
    document.attachments = {};
  }
  return document;
}

/** Attachments are inlined as data URLs, so only the common types get a name. */
const MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
  zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

function mimeFor(name) {
  const extension = extname(String(name ?? '')).slice(1).toLowerCase();
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

/** Shown by `/todo help` and appended to every rejected argument. */
const TODO_COMMAND_USAGE = [
  '/todo                     未完成的条目',
  '/todo all                 全部条目',
  '/todo done                已完成的条目',
  '/todo add <标题>          新增（可用 `标题 | 详情 | 截止时间`）',
  '/todo finish <序号|id>    勾掉',
  '/todo undo <序号|id>      取消勾选',
  '/todo remove <序号|id>    删除',
  '',
  '其余写法按新增处理：/todo 把 gzcode 放到内网测试',
].join('\n');

/**
 * Everyday wording that maps onto a subcommand, so a rushed line still lands.
 * Longer aliases are matched first, otherwise `已完成` would read as `完成`.
 */
const TODO_COMMAND_ALIASES = new Map(
  Object.entries({
    列表: 'open',
    查看: 'open',
    全部: 'all',
    所有: 'all',
    已完成: 'done',
    新增: 'add',
    添加: 'add',
    加上: 'add',
    记一下: 'add',
    记录: 'add',
    提醒我: 'add',
    勾掉: 'finish',
    完成: 'finish',
    做完: 'finish',
    搞定: 'finish',
    取消勾选: 'undo',
    恢复: 'undo',
    删除: 'remove',
    删掉: 'remove',
    移除: 'remove',
    帮助: 'help',
  }).sort((left, right) => right[0].length - left[0].length),
);

/** One numbered row; the number is the item's position in the stored list. */
function todoCommandLine(item, index) {
  const parts = [`${index + 1}. [${item.done === true ? '已完成' : '未完成'}] ${item.title}`];
  if (typeof item.due === 'string' && item.due !== '') parts.push(`截止 ${item.due.replace('T', ' ')}`);
  parts.push(`id ${item.id}`);
  let line = parts.join(' · ');
  if (typeof item.detail === 'string' && item.detail.trim() !== '') {
    line += `\n   详情：${item.detail.trim().replace(/\n/g, '\n   ')}`;
  }
  if (item.attachment && typeof item.attachment === 'object') {
    line += `\n   附件：${item.attachment.name || '(未命名)'}`;
  }
  return line;
}

/** Accepts a 1-based position, a full id, or an unambiguous id prefix. */
function findTodoIndex(items, token) {
  const wanted = String(token ?? '').trim();
  if (wanted === '') return -1;
  if (/^\d+$/.test(wanted)) {
    const index = Number(wanted) - 1;
    return index >= 0 && index < items.length ? index : -1;
  }
  const exact = items.findIndex((item) => item && item.id === wanted);
  if (exact >= 0) return exact;
  const matches = items.filter((item) => item && String(item.id).startsWith(wanted));
  return matches.length === 1 ? items.indexOf(matches[0]) : -1;
}

/**
 * Leading filler a sentence carries when someone writes a task out loud
 * ("今天新增一条任务，…"), so the stored title is the task and not the sentence.
 */
const TODO_COMMAND_FILLER =
  /^(?:今天|明天|后天|现在|稍后|帮我|请|麻烦)?\s*(?:新增|添加|新建|添加一条|加|记一下|记录|提醒我)\s*(?:一条|一个|个)?\s*(?:任务|待办|todo)?\s*[，,：:、\-]?\s*/i;

/**
 * The `/todo` command's core, kept pure so the arguments can be checked without
 * a runtime: it answers with the text to show and, when the list changes, the
 * document to persist.
 */
export function runTodoCommand(document, raw) {
  const doc = asDocument(document);
  const items = doc.items;
  const input = String(raw ?? '').trim();
  const space = input.search(/\s/);
  const head = space === -1 ? input : input.slice(0, space);
  const tail = space === -1 ? '' : input.slice(space + 1).trim();
  const open = items.filter((item) => item && item.done !== true);
  const summary = `Todo 面板：共 ${items.length} 条，未完成 ${open.length} 条，已完成 ${
    items.length - open.length
  } 条。`;

  const VERBS = ['', 'open', 'list', 'all', 'done', 'add', 'finish', 'undo', 'remove', 'help', '?'];
  const canonical = (word) => {
    const plain = word.toLowerCase();
    if (VERBS.indexOf(plain) >= 0) return plain === 'list' ? 'open' : plain;
    return TODO_COMMAND_ALIASES.get(word) ?? null;
  };

  let verb = canonical(head);
  let rest = tail;
  let guessed = false;
  if (verb === null) {
    // Someone wrote a sentence instead of a subcommand. A short ASCII word is a
    // typo, anything else — including 写周报 — is a task in their own words.
    if (space === -1 && /^[a-z0-9_-]+$/i.test(input) && input.length < 4) {
      return { text: `不认识的子命令「${head}」。\n\n${TODO_COMMAND_USAGE}`, document: null };
    }
    verb = 'add';
    rest = input;
    guessed = true;
  }

  if (verb === '' || verb === 'open' || verb === 'all' || verb === 'done') {
    const wanted =
      verb === 'all'
        ? items
        : items.filter((item) => (verb === 'done' ? item.done === true : item.done !== true));
    if (wanted.length === 0) {
      const empty = verb === 'done' ? '还没有已完成的条目。' : '没有未完成的条目。';
      return { text: `${summary}\n\n${empty}`, document: null };
    }
    const lines = wanted.map((item) => todoCommandLine(item, items.indexOf(item)));
    return { text: `${summary}\n\n${lines.join('\n')}`, document: null };
  }

  if (verb === 'add') {
    if (rest === '') {
      return { text: `要加什么？例子：/todo add 写周报\n\n${TODO_COMMAND_USAGE}`, document: null };
    }
    const [titlePart = '', detailPart = '', duePart = ''] = rest
      .split('|')
      .map((part) => part.trim());
    const spoken = rest.replace(TODO_COMMAND_FILLER, '').trim();
    const item = {
      id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      title: ((guessed ? spoken : titlePart) || titlePart || rest).slice(0, 200),
      detail: detailPart,
      due: duePart,
      createdAt: Date.now(),
      done: false,
      completedAt: null,
    };
    return {
      text: `${guessed ? '没匹配到子命令，按新增处理。\n' : ''}已添加：${item.title}\n${summary}`,
      document: { ...doc, items: items.concat([item]) },
    };
  }

  if (verb === 'finish' || verb === 'undo' || verb === 'remove') {
    const index = findTodoIndex(items, rest);
    if (index < 0) {
      return {
        text: `找不到「${rest || '（空）'}」。先发 /todo 看序号，序号从 1 开始。\n\n${TODO_COMMAND_USAGE}`,
        document: null,
      };
    }
    const target = items[index];
    if (verb === 'remove') {
      const attachments = { ...doc.attachments };
      delete attachments[target.id];
      return {
        text: `已删除：${target.title}`,
        document: {
          ...doc,
          items: items.filter((_, position) => position !== index),
          attachments,
        },
      };
    }
    const done = verb === 'finish';
    const next = items.map((item, position) =>
      position === index
        ? { ...item, done, completedAt: done ? new Date().toISOString() : null }
        : item,
    );
    return {
      text: `${done ? '已勾掉' : '已恢复'}：${target.title}`,
      document: { ...doc, items: next },
    };
  }

  if (verb === 'help' || verb === '?') return { text: TODO_COMMAND_USAGE, document: null };
  return { text: `不认识的子命令「${head}」。\n\n${TODO_COMMAND_USAGE}`, document: null };
}


/**
 * Runs inside the toast's own PowerShell process. The title and body travel in
 * the environment, never in this text: a task called `"; Remove-Item ...` must
 * not be able to change the script. The notifier id is the AUMID Windows
 * registers for `powershell.exe`, so the toast has a real sender to show under.
 */
const TOAST_SCRIPT = `
$ErrorActionPreference = 'Stop'
$title = [string]$env:TODO_TOAST_TITLE
$body = [string]$env:TODO_TOAST_BODY
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$texts = $xml.GetElementsByTagName('text')
$texts.Item(0).AppendChild($xml.CreateTextNode($title)) | Out-Null
$texts.Item(1).AppendChild($xml.CreateTextNode($body)) | Out-Null
$xml.GetElementsByTagName('toast').Item(0).SetAttribute('duration', 'long')
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe')
$notifier.Show([Windows.UI.Notifications.ToastNotification]::new($xml))
`.trim();

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

  const writeNow = async (document) => {
    try {
      await mkdir(dirname(file), { recursive: true });
      const temporary = `${file}.tmp`;
      await writeFile(temporary, JSON.stringify(document), 'utf8');
      await rename(temporary, file);
    } catch (error) {
      console.error(
        '[todo-panel] state could not be written:',
        String(error && error.message ? error.message : error),
      );
      throw error;
    }
  };

  /**
   * Runs `change` inside the serialised write chain: it reads the document the
   * previous write left on disk, and the revision bump happens in that same
   * slot, so two changes can never both start from the same revision.
   *
   * `change` returns `{ value }` to save the document it was given, `{ replace }`
   * to save another document, or `{ skip: true }` to leave the file alone.
   */
  const transact = (change) => {
    const outcome = writes.then(async () => {
      const document = asDocument(await readDocument());
      const revision = documentRev(document);
      const edited = (await change(document, revision)) ?? {};
      if (edited.skip === true) {
        return { written: false, rev: revision, value: edited.value, document };
      }
      const next = asDocument(edited.replace ?? document);
      next.rev = revision + 1;
      next.savedAt = Date.now();
      await writeNow(next);
      return { written: true, rev: next.rev, value: edited.value };
    });
    // A rejected change or a failed write must not wedge the chain for every
    // later save; the caller still sees the rejection through `outcome`.
    writes = outcome.then(
      () => true,
      () => true,
    );
    return outcome;
  };

  /**
   * Starts a toast in its own process. Only the spawn is awaited: the panel's
   * request must not wait for a shell, and a missing PowerShell is a failure we
   * report rather than an exception that escapes the route.
   *
   * The child is deliberately not `detached`: Windows would then start it
   * without a console, and both powershell.exe and pwsh.exe exit 0 before
   * running `-Command` in that state. `windowsHide` plus ignored stdio gives
   * the same result the toast needs - a hidden, non-blocking helper - and the
   * helper still runs the script.
   */
  const showToast = (title, body) => {
    const args = ['-NoProfile', '-NonInteractive', '-Command', TOAST_SCRIPT];
    const options = {
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, TODO_TOAST_TITLE: title, TODO_TOAST_BODY: body },
    };
    const launch = (command) =>
      new Promise((started, failed) => {
        const child = spawn(command, args, options);
        child.once('spawn', () => {
          // The promise is settled, so this listener only keeps a late error
          // from surfacing as an unhandled event once the toast is running.
          child.once('error', () => {});
          child.unref();
          started(true);
        });
        child.once('error', failed);
      });
    return launch('powershell.exe').catch(() => launch('pwsh.exe'));
  };

  /** Toast endpoint; also reachable alone when the main prefix is already taken. */
  const handleNotify = async (request, response) => {
    const method = request.method ?? 'GET';
    if (method !== 'POST') {
      sendJson(response, 405, { error: 'method not allowed' });
      return;
    }
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: 'cross-origin request refused' });
      return;
    }
    let payload;
    try {
      payload = JSON.parse(await readBody(request));
    } catch (error) {
      sendJson(response, 400, { error: String(error && error.message ? error.message : error) });
      return;
    }
    const title = String((payload && payload.title) ?? '').trim() || 'Todo 提醒';
    const body = String((payload && payload.body) ?? '').trim();
    try {
      await showToast(title, body);
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        error: String(error && error.message ? error.message : error),
      });
    }
  };

  // Kept as a function so the tools below still work on a host without a web server.
  const registerRoutes = (webServer) =>
    webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: async (request, response) => {
        const method = request.method ?? 'GET';
        const path = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
          .pathname;
        if (path === NOTIFY_ROUTE) {
          await handleNotify(request, response);
          return;
        }
        if (path !== STATE_ROUTE) {
          sendJson(response, 404, { error: `no such route: ${path}` });
          return;
        }
        if (method === 'GET' || method === 'HEAD') {
          const document = await readDocument();
          sendJson(response, 200, document ?? emptyDocument());
          return;
        }
        if (method === 'POST') {
          if (!sameOrigin(request)) {
            sendJson(response, 403, { error: 'cross-origin request refused' });
            return;
          }
          let payload;
          try {
            payload = JSON.parse(await readBody(request));
          } catch (error) {
            sendJson(response, 400, {
              error: String(error && error.message ? error.message : error),
            });
            return;
          }
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            sendJson(response, 400, { error: 'expected a state document' });
            return;
          }
          const requested = Number(payload.baseRev ?? 0);
          const baseRev = Number.isFinite(requested) ? requested : Number.NaN;
          // `baseRev` is protocol, not state; the stored document must not gain it.
          delete payload.baseRev;
          let outcome;
          try {
            outcome = await transact((stored, revision) => {
              if (baseRev !== revision) {
                return { skip: true, value: { conflict: true, stored } };
              }
              return { replace: payload, value: { conflict: false } };
            });
          } catch (error) {
            sendJson(response, 500, {
              error: String(error && error.message ? error.message : error),
            });
            return;
          }
          if (outcome.value && outcome.value.conflict === true) {
            sendJson(response, 409, {
              error: 'stale',
              rev: outcome.rev,
              document: outcome.document ?? emptyDocument(),
            });
            return;
          }
          sendJson(response, 200, { ok: true, rev: outcome.rev });
          return;
        }
        sendJson(response, 405, { error: 'method not allowed' });
      },
    });

  // Services mount in composition order, and a bundle-installed plugin can run
  // before the Host's registries do. `ctx.inject` re-runs each registration when
  // its service becomes available, so the panel no longer goes blind when the
  // profile loads it first.
  ctx.inject(["webServer"], (webCtx) => {
    const webServer = webCtx.webServer;
    try {
      webCtx.effect(() => registerRoutes(webServer), "todo-panel: http routes");
    } catch (error) {
      // An earlier load of this plugin already owns the route and still answers
      // it; failing here would take the panel and the tool down with it.
      console.warn(
        "[todo-panel] the state route is already registered; keeping the existing one:",
        String(error && error.message ? error.message : error),
      );
      // That older handler knows nothing about the toast endpoint, so serve it
      // on a path of its own until the process restarts.
      try {
        webCtx.effect(
          () =>
            webServer.register({
              kind: "exact",
              path: `${ROUTE_PREFIX}-notify`,
              handler: handleNotify,
            }),
          "todo-panel: notify route",
        );
      } catch (fallbackError) {
        console.warn(
          "[todo-panel] the notify route is already registered too:",
          String(fallbackError && fallbackError.message ? fallbackError.message : fallbackError),
        );
      }
    }
  });

  // The slash menu lists commands, not tools; `/todo` is what a person types.
  ctx.inject(["commands"], (commandCtx) => {
    commandCtx.effect(
      () =>
        commandCtx.commands.register({
          name: "todo",
          description: "查看和管理 Todo 面板（all / add / finish / undo / remove）",
          input: { hint: "[all | add <标题> | finish <序号> | undo <序号> | remove <序号>]" },
          recordInput: false,
          handler: async (invocation) => {
            try {
              const outcome = await transact((document) => {
                const result = runTodoCommand(document, invocation.rawInput);
                // A read-only branch must not cost a revision.
                return result.document
                  ? { replace: result.document, value: result.text }
                  : { skip: true, value: result.text };
              });
              return { kind: "success", text: String(outcome.value ?? "") };
            } catch (error) {
              return {
                kind: "error",
                text: String(error && error.message ? error.message : error),
              };
            }
          },
        }),
      "todo-panel: /todo command",
    );
  });

  ctx.inject(["tools"], (toolCtx) => registerAgentTools(toolCtx, toolCtx.tools, transact));
}

/**
 * The five agent tools. It lives outside `apply` so the injected context that
 * carries `tools` can be handed straight in, and so a late-mounting registry
 * gets them too.
 */
function registerAgentTools(ctx, tools, transact) {
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

  /** The flattened item the mutation tools return; the same shape `todo_list` shows. */
  const itemSchema = () => ({
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
  });

  /** The item a tool argument names, or the error the model needs to retry with. */
  const findItem = (document, id) => {
    const item = document.items.find(
      (entry) => entry && typeof entry === 'object' && String(entry.id ?? '') === id,
    );
    if (item === undefined) throw new Error(`no todo with id ${id}`);
    return item;
  };

  const formatSize = (bytes) => {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  ctx.effect(
    () =>
      tools.register({
        name: 'todo_add',
        description:
          "Add a task to the user's Todo panel. Use it when the user asks you to remember something, add a todo, or note a follow-up. It changes the panel immediately and returns the new item.",
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['title'],
          properties: {
            title: { type: 'string', description: 'What to do, one line. Must not be empty.' },
            detail: { type: 'string', description: 'Optional longer note for the task.' },
            due: {
              type: 'string',
              description: "Optional due time as 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm'.",
            },
          },
        },
        output: {
          schema: itemSchema(),
          render: (args, value) => {
            const lines = [`已在 Todo 面板添加待办：${value.title}（id ${value.id}）。`];
            if (value.due) lines.push(`截止时间：${String(value.due).replace('T', ' ')}`);
            if (value.detail) lines.push(`详情：${value.detail}`);
            return [{ type: 'text', text: lines.join('\n') }];
          },
        },
        async execute(args) {
          const title = typeof args.title === 'string' ? args.title.trim() : '';
          if (title === '') throw new Error('todo_add needs a non-empty title');
          const outcome = await transact((document) => {
            const item = {
              id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
              title,
              detail: typeof args.detail === 'string' ? args.detail : '',
              due: typeof args.due === 'string' ? args.due : '',
              createdAt: Date.now(),
              done: false,
              completedAt: null,
            };
            document.items.push(item);
            return { value: toToolItem(item) };
          });
          return outcome.value;
        },
        presentCall: (args) => ({
          card: 'generic',
          title: 'Add todo',
          kind: 'edit',
          rawInput: args ?? {},
        }),
      }),
    'todo-panel: todo_add tool',
  );

  ctx.effect(
    () =>
      tools.register({
        name: 'todo_update',
        description:
          "Change one task in the user's Todo panel: rename it, edit its details or due time, or mark it completed / reopen it.",
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'The id `todo_list` shows for the task.' },
            title: { type: 'string', description: 'New title.' },
            detail: { type: 'string', description: 'New details; an empty string clears them.' },
            due: { type: 'string', description: 'New due time; an empty string clears it.' },
            done: {
              type: 'boolean',
              description: 'true marks the task completed, false reopens it.',
            },
          },
        },
        output: {
          schema: itemSchema(),
          render: (args, value) => {
            const changed = [];
            if (typeof args.title === 'string') changed.push('标题');
            if (typeof args.detail === 'string') changed.push('详情');
            if (typeof args.due === 'string') changed.push('截止时间');
            if (typeof args.done === 'boolean') changed.push(args.done ? '标记为已完成' : '标记为未完成');
            const head = changed.length > 0 ? `已更新待办（${changed.join('、')}）：` : '待办未改动：';
            return [{ type: 'text', text: `${head}\n${describeItems([value])}` }];
          },
        },
        async execute(args) {
          const id = typeof args.id === 'string' ? args.id : '';
          if (id === '') throw new Error('todo_update needs an id');
          const outcome = await transact((document) => {
            const item = findItem(document, id);
            if (typeof args.title === 'string') item.title = args.title;
            if (typeof args.detail === 'string') item.detail = args.detail;
            if (typeof args.due === 'string') item.due = args.due;
            if (typeof args.done === 'boolean') {
              item.done = args.done;
              item.completedAt = args.done ? new Date().toISOString() : null;
            }
            return { value: toToolItem(item) };
          });
          return outcome.value;
        },
        presentCall: (args) => ({
          card: 'generic',
          title: 'Update todo',
          kind: 'edit',
          rawInput: args ?? {},
        }),
      }),
    'todo-panel: todo_update tool',
  );

  ctx.effect(
    () =>
      tools.register({
        name: 'todo_remove',
        description:
          "Delete one task from the user's Todo panel, together with the attachment it carries. Use it only for a task the user wants gone.",
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: {
            id: { type: 'string', description: 'The id `todo_list` shows for the task.' },
          },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['ok', 'id'],
            properties: {
              ok: { type: 'boolean' },
              id: { type: 'string' },
            },
          },
          render: (args, value) => [
            {
              type: 'text',
              text: `已从 Todo 面板删除待办 ${value.id}，它的附件也一起移除。`,
            },
          ],
        },
        async execute(args) {
          const id = typeof args.id === 'string' ? args.id : '';
          if (id === '') throw new Error('todo_remove needs an id');
          const outcome = await transact((document) => {
            const item = findItem(document, id);
            document.items = document.items.filter((entry) => entry !== item);
            delete document.attachments[id];
            return { value: { ok: true, id } };
          });
          return outcome.value;
        },
        presentCall: (args) => ({
          card: 'generic',
          title: 'Remove todo',
          kind: 'delete',
          rawInput: args ?? {},
        }),
      }),
    'todo-panel: todo_remove tool',
  );

  ctx.effect(
    () =>
      tools.register({
        name: 'todo_attach',
        description:
          "Attach a local file to a task in the user's Todo panel. The file is copied into the panel's own state, so it survives restarts and port changes.",
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'path'],
          properties: {
            id: { type: 'string', description: 'The id `todo_list` shows for the task.' },
            path: {
              type: 'string',
              description:
                'The file to attach; a relative path resolves against the current working directory.',
            },
          },
        },
        output: {
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'size', 'type'],
            properties: {
              name: { type: 'string' },
              size: { type: 'integer' },
              type: { type: 'string' },
            },
          },
          render: (args, value) => [
            {
              type: 'text',
              text: `已为待办 ${String(args.id ?? '')} 添加附件 ${value.name}（${formatSize(value.size)}，${value.type}）。`,
            },
          ],
        },
        async execute(args) {
          const id = typeof args.id === 'string' ? args.id : '';
          if (id === '') throw new Error('todo_attach needs an id');
          const given = typeof args.path === 'string' ? args.path.trim() : '';
          if (given === '') throw new Error('todo_attach needs a path');
          // The model speaks in transcript paths, so a relative one follows the
          // working directory of this Host process, where the session started.
          const source = resolve(given);
          let bytes;
          try {
            bytes = await readFile(source);
          } catch (error) {
            throw new Error(
              `cannot read ${source}: ${String(error && error.message ? error.message : error)}`,
            );
          }
          if (bytes.length > MAX_BODY_BYTES) {
            throw new Error(`the attachment is larger than 32 MB: ${source}`);
          }
          const name = basename(source);
          const type = mimeFor(name);
          const outcome = await transact((document) => {
            const item = findItem(document, id);
            item.attachment = { name, size: bytes.length, type, stored: true };
            document.attachments[id] = `data:${type};base64,${bytes.toString('base64')}`;
            return { value: { name, size: bytes.length, type } };
          });
          return outcome.value;
        },
        presentCall: (args) => ({
          card: 'generic',
          title: 'Attach file to todo',
          kind: 'edit',
          rawInput: args ?? {},
        }),
      }),
    'todo-panel: todo_attach tool',
  );
}
