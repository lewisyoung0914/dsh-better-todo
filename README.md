# dsh-better-todo

English | [中文](README.zh.md)

A todo panel for the DeepSeek Harness Web UI. It floats above the right side of the window, snaps to whichever edge you drag it near, and carries a pomodoro timer in its header.

## Features

- **Floating panel, four-edge snapping** — drag the header to move it; release and it settles against the nearest window edge (left / right / top / bottom) so it never ends up half off-screen. Double-click the header to reset the position.
- **Sidebar launcher** — a `Todo` row sits beside Settings and shows how many items are still open. The panel remembers whether it was open.
- **Two views** — `Home` groups items into **Today** (due today) and **More** (everything else, including items with no due date), both collapsible. `All` splits **unfinished** and **finished**; the finished list shows 10 at a time and loads 20 more per click.
- **Full item form** — `+` opens a page for the title, details, due time and one attachment (kept in IndexedDB). Clicking an item reopens the same page for editing; attachments can be replaced or removed.
- **Pomodoro timer** — the clock in the panel header opens a timer page: focus length (presets 15 / 30 / 45 / 60 minutes, or any value from 1 to 180 typed by hand), a round count (1–12) and a break interval (presets 3 / 5 / 10 / 15, or any value from 1 to 120). Focus and break alternate automatically, and each phase end raises a Windows notification. The countdown keeps running — and stays visible in the header — while you work in the list.
- **Bilingual UI** — Chinese and English, following the app's language setting.
- **Local only** — items live in `localStorage`, attachments in IndexedDB. Nothing is uploaded anywhere.

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

| Key | Where | Contents |
| --- | --- | --- |
| `dsh.todo-panel.items.v1` | `localStorage` | items: title, details, due time, state, attachment metadata |
| `dsh.todo-panel.open.v1` | `localStorage` | whether the panel is open |
| `dsh.todo-panel.position.v1` | `localStorage` | panel position and snapped edge |
| `dsh.todo-panel.pomodoro.v1` | `localStorage` | timer settings and the running phase |
| `dsh-todo-panel` / `attachments` | IndexedDB | attachment blobs, keyed by item id |

Clearing the site data removes everything. Items are per browser profile, not per DSH account.

## Development

No build step — the plugin is plain JavaScript loaded as an ES module.

| File | Role |
| --- | --- |
| `index.js` | host half; `apply()` is intentionally empty — the plugin has no server side |
| `client.js` | the whole UI: stores, the panel, the item form, the pomodoro engine, CSS |
| `cordis.patch.yml` | the one row this bundle inserts into the profile |
| `locale/zh.json`, `locale/en.json` | market metadata (title, description) |
| `icon.svg` | plugin icon |

There is no JSX: components are built with `React.createElement` (aliased to `h`). Edits to `client.js` are picked up by the running app through hot reload; a change to `cordis.patch.yml` or `package.json` needs the bundle reinstalled.

## License

MIT
