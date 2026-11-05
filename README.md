# dsh-better-todo

A todo panel for the DeepSeek Harness Web UI, docked to the right edge of the window — with a pomodoro timer in its header.

一个挂在 DeepSeek Harness Web UI 右侧的待办面板，标题栏里还带一个番茄钟。

## Features · 功能

- **Floating panel, drag anywhere** — grab the header to drag, and it snaps to whichever window edge is closest (left / right / top / bottom) so it never ends up half off-screen. Double-click the header to reset the position.
- **Launcher in the sidebar** — a `Todo` row sits beside Settings; the badge shows how many items are still open. The panel remembers whether it was open.
- **Two views** — `首页` groups items into 今天 (due today) and 更多 (everything else, including items without a due date), both collapsible; `全部` lists 未完成 and 已完成, with the completed list paged 10 at a time and +20 per "show more".
- **Full detail form** — a `+` opens a page for the title, details, due time and one attachment (stored in IndexedDB); clicking an item reopens the same page for editing.
- **Pomodoro timer** — the clock in the panel header switches to a full timer page: focus length 15 / 30 / 45 / 60 minutes, a round count (1–12) and a break interval (3 / 5 / 10 / 15 minutes). Focus and break alternate automatically, and each phase end raises a Windows toast notification. The countdown also shows in the header while you are looking at the list.
- **Chinese and English UI**, following the app's language setting.
- **Local only** — items live in `localStorage`, attachments in IndexedDB. Nothing leaves the machine.

## Install · 安装

From the plugin market, or by hand:

```sh
dsh plugin --profile web add dsh-better-todo
```

The package is not on npm yet — install it straight from this repository instead:

```sh
dsh plugin --profile web add https://github.com/lewisyoung0914/dsh-better-todo
```

Then restart `dsh web` (or the desktop app) and refresh the page.

## Storage · 数据

| Key | Where |
| --- | --- |
| `dsh.todo-panel.items.v1` | items, `localStorage` |
| `dsh.todo-panel.open.v1` | panel open state |
| `dsh.todo-panel.position.v1` | panel position and snapped edge |
| `dsh.todo-panel.pomodoro.v1` | timer settings and running phase |
| IndexedDB `dsh-todo-panel` / `attachments` | attachment blobs, keyed by item id |

Clearing the browser's site data removes everything.

## License

MIT
