# dsh-better-todo

English | [中文](README.zh.md)

A todo panel for the DeepSeek Harness Web UI. It floats above the right side of the window, snaps to whichever edge you drag it near, and carries a pomodoro timer in its header.

## Features

- **Floating panel, four-edge snapping** — drag the header to move it; release and it settles against the nearest window edge (left / right / top / bottom) so it never ends up half off-screen. Double-click the header to reset the position.
- **Sidebar launcher** — a `Todo` row sits beside Settings and shows how many items are still open. The panel remembers whether it was open.
- **Two views** — `Home` groups items into **Today** (due today) and **More** (everything else, including items with no due date), both collapsible. `All` splits **unfinished** and **finished**; the finished list shows 10 at a time and loads 20 more per click.
- **Detail page, then edit on demand** — `+` opens a form for the title, details, due time and one attachment. Clicking an item opens a read-only page first; nothing can be changed until **Edit** in the top right switches it to the form.
- **Attachments behave by type** — clicking an image attachment opens it full-screen (click the backdrop or press Escape to close); any other file downloads.
- **Pomodoro timer** — the clock in the panel header opens a timer page: focus length (presets 15 / 30 / 45 / 60 minutes, or any value from 1 to 180 typed by hand), a round count (1–12) and a break interval (presets 3 / 5 / 10 / 15, or any value from 1 to 120). Focus and break alternate automatically, and each phase end raises a Windows notification. The countdown keeps running — and stays visible in the header — while you work in the list.
- **Bilingual UI** — Chinese and English, following the app's language setting.
- **Survives restarts** — the list, the attachment files, the panel position and the timer settings live in one JSON document under `~/.dsh/todo-panel/`, written by the plugin's Host half. Nothing is uploaded anywhere.

## Install

```sh
dsh plugin --profile web add https://github.com/lewisyoung0914/dsh-better-todo
```

Then restart `dsh web` (or the desktop app) and refresh the page. Once the plugin is listed in the market you can install it by name instead:

```sh
dsh plugin --profile web add dsh-better-todo
```

Requires a DSH build that provides the web client slots `shell.overlay` and `sidebar.footer.action` (developed against `0.2.1-rc.3`).

## Usage

| Action | Where |
| --- | --- |
| Open / close the panel | the `Todo` row at the sidebar foot |
| Move the panel | drag the header; edges snap on release |
| Reset the position | double-click the header |
| Create an item | `+` in the panel header |
| Edit an item | click its text |
| Complete an item | the checkbox on its left |
| Open the timer | the clock (or the running countdown) in the panel header |

Inside the timer page, `Start` / `Pause` control the current phase and `Reset` returns to idle with the counter cleared. Settings can only be changed while the timer is idle, so a running countdown never jumps.

## Notifications

Phase ends are announced through the browser's notification API, which Windows surfaces as a toast. Permission is requested the first time you press `Start`; if it is denied, the timer still runs but stays silent.

Two things worth knowing:

- A window minimised for a long time has its timers throttled by Chromium, so a notification can arrive up to about a minute late. The plugin re-checks the phase as soon as the window becomes visible again.
- Windows Focus Assist / Do Not Disturb suppresses the toast; that is outside the plugin's control.

## Storage

Everything lives in one JSON document that the plugin's Host half owns:

```
<DSH_HOME>/todo-panel/state.json      # ~/.dsh/todo-panel/state.json by default
```

The page reads and writes it through `/todo-panel/state` on its own origin. That indirection is deliberate: the desktop picks a fresh web port on every launch, and `localStorage`/IndexedDB are partitioned by origin, so a browser-stored list would be a different — empty — database after each restart.

| Field | Contents |
| --- | --- |
| `items` | title, details, due time, completion state, attachment metadata |
| `open` | whether the panel is open |
| `position` | panel position and the snapped edge |
| `pomodoro` | timer settings and the running phase |
| `attachments` | one data URL per item id |

The file is plain JSON: back it up, read it, or delete it. It is per profile, not per DSH account, and nothing leaves the machine. A browser session that still holds data from an earlier version migrates it on first load and then clears the old keys.

## Development

No build step — the plugin is plain JavaScript loaded as an ES module.

| File | Role |
| --- | --- |
| `index.js` | Host half: serves `/todo-panel/state`, keeps the JSON document on disk |
| `client.js` | the whole UI: stores, the panel, the item form, the pomodoro engine, CSS |
| `cordis.patch.yml` | the one row this bundle inserts into the profile |
| `locale/zh.json`, `locale/en.json` | market metadata (title, description) |
| `icon.svg` | plugin icon |

There is no JSX: components are built with `React.createElement` (aliased to `h`). Edits to `client.js` are picked up by the running app through hot reload; a change to `cordis.patch.yml` or `package.json` needs the bundle reinstalled.

## License

MIT
