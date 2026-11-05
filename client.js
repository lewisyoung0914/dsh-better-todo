window.__ModuleLoader__.load({
  id: '@local/todo-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'todo-panel';
    const STORAGE_ITEMS = 'dsh.todo-panel.items.v1';
    const STORAGE_OPEN = 'dsh.todo-panel.open.v1';
    const STORAGE_POSITION = 'dsh.todo-panel.position.v1';
    const STORAGE_POMODORO = 'dsh.todo-panel.pomodoro.v1';

    const DB_NAME = 'dsh-todo-panel';
    const DB_STORE = 'attachments';

    /** Gap kept between a snapped edge and the window edge, in px. */
    const EDGE_MARGIN = 16;
    /** Pointer distance from an edge that pulls the panel onto it, in px. */
    const SNAP_THRESHOLD = 44;
    /** First page of completed items, and how many each "show more" adds. */
    const DONE_PAGE = 10;
    const DONE_MORE = 20;

    /** Pomodoro presets offered in the panel, in minutes. */
    const POMO_FOCUS_CHOICES = [15, 30, 45, 60];
    const POMO_BREAK_CHOICES = [3, 5, 10, 15];

    /** Text carried by the package; the locale service is consulted first. */
    const DICTS = {
      zh: {
        title: 'Todo',
        openPanel: '打开待办',
        closePanel: '关闭待办',
        close: '收起待办',
        drag: '拖动标题栏可移动，靠近边缘自动吸附，双击复位',
        tabHome: '首页',
        tabAll: '全部',
        sectionToday: '今天',
        sectionMore: '更多',
        sectionOpen: '未完成',
        sectionDone: '已完成',
        emptyAll: '还没有待办，点 + 新建一条',
        emptySection: '暂无',
        newTitle: '新建待办',
        editTitle: '编辑待办',
        edit: '编辑',
        fieldTitle: '事件名称',
        titlePlaceholder: '要做什么？',
        fieldDetail: '详情',
        detailPlaceholder: '补充说明（可选）',
        fieldDue: '截止时间',
        fieldAttachment: '附件',
        addAttachment: '添加附件',
        removeAttachment: '移除附件',
        save: '保存',
        saving: '保存中…',
        cancel: '取消',
        back: '返回',
        showMore: '展示更多',
        todayShort: '今天',
        markDone: '标记为已完成',
        markUndone: '标记为未完成',
        remove: '删除',
        pomo: '番茄钟',
        pomoFocus: '专注',
        pomoBreak: '休息',
        pomoReady: '点击设置',
        pomoDuration: '时长',
        pomoRounds: '番茄数',
        pomoBreakLen: '休息间隔',
        pomoStart: '开始',
        pomoPause: '暂停',
        pomoReset: '重置',
        pomoMinute: '分钟',
        pomoFocusDone: '专注结束，休息一下',
        pomoBreakDone: '休息结束，继续专注',
        pomoAllDone: '全部番茄完成 🎉',
        pomoNotification: '番茄钟',
        attachmentMissing: '附件已不可用',
      },
      en: {
        title: 'Todo',
        openPanel: 'Open todo list',
        closePanel: 'Close todo list',
        close: 'Hide todo list',
        drag: 'Drag the header to move; edges snap into place, double-click to reset',
        tabHome: 'Home',
        tabAll: 'All',
        sectionToday: 'Today',
        sectionMore: 'More',
        sectionOpen: 'Open',
        sectionDone: 'Done',
        emptyAll: 'Nothing yet — press + to add one.',
        emptySection: 'Nothing here',
        newTitle: 'New todo',
        editTitle: 'Edit todo',
        edit: 'Edit',
        fieldTitle: 'Title',
        titlePlaceholder: 'What needs doing?',
        fieldDetail: 'Details',
        detailPlaceholder: 'Anything else (optional)',
        fieldDue: 'Due',
        fieldAttachment: 'Attachment',
        addAttachment: 'Add attachment',
        removeAttachment: 'Remove attachment',
        save: 'Save',
        saving: 'Saving…',
        cancel: 'Cancel',
        back: 'Back',
        showMore: 'Show more',
        todayShort: 'Today',
        markDone: 'Mark as done',
        markUndone: 'Mark as not done',
        remove: 'Delete',
        pomo: 'Pomodoro',
        pomoFocus: 'Focus',
        pomoBreak: 'Break',
        pomoReady: 'Click to set up',
        pomoDuration: 'Length',
        pomoRounds: 'Rounds',
        pomoBreakLen: 'Break',
        pomoStart: 'Start',
        pomoPause: 'Pause',
        pomoReset: 'Reset',
        pomoMinute: 'min',
        pomoFocusDone: 'Focus finished — take a break',
        pomoBreakDone: 'Break finished — back to focus',
        pomoAllDone: 'All pomodoros done 🎉',
        pomoNotification: 'Pomodoro',
        attachmentMissing: 'Attachment unavailable',
      },
    };

    const CSS = `
.dshtodo-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:none;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;cursor:pointer;transition:background .15s ease,color .15s ease}
.dshtodo-btn>svg{flex:none}
.dshtodo-btn:hover{background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent));color:var(--dsw-alias-label-primary)}
.dshtodo-btn.is-open{background:var(--dsw-alias-interactive-bg-active,color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent));color:var(--dsw-alias-brand-primary)}
.dshtodo-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshtodo-btn.is-row{width:100%;height:auto;justify-content:flex-start;gap:8px;padding:6px 10px;font-size:13px;text-align:left}
.dshtodo-btn-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshtodo-btn-count{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-btn.is-open .dshtodo-btn-count{color:var(--dsw-alias-brand-primary)}
.dshtodo-btn-badge{position:absolute;top:-1px;right:-1px;min-width:14px;height:14px;padding:0 3px;border-radius:7px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-size:9px;font-weight:600;line-height:14px;text-align:center}
.dshtodo-panel{position:fixed;top:84px;right:16px;z-index:20;pointer-events:auto;display:flex;flex-direction:column;width:340px;max-width:calc(100vw - 32px);max-height:calc(100vh - 120px);overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 12px 32px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06);font-family:inherit}
.dshtodo-panel.is-floating{right:auto}
.dshtodo-panel.is-snapped{box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,transparent),0 12px 32px rgba(0,0,0,.14),0 2px 6px rgba(0,0,0,.06)}
.dshtodo-header{flex:none;display:flex;align-items:center;gap:6px;padding:9px 8px 9px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:grab;user-select:none;touch-action:none}
.dshtodo-panel.is-dragging .dshtodo-header{cursor:grabbing}
.dshtodo-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshtodo-sub{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-actions{display:flex;align-items:center;gap:2px;flex:none}
.dshtodo-icon-btn{flex:none;width:24px;height:24px;padding:0;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:opacity .12s ease,color .12s ease,background .12s ease}
.dshtodo-item:hover .dshtodo-icon-btn,.dshtodo-icon-btn:focus-visible,.dshtodo-icon-btn.is-visible{opacity:1}
.dshtodo-icon-btn:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dshtodo-remove:hover{color:var(--dsw-alias-state-error-primary)}
.dshtodo-header .dshtodo-icon-btn,.dshtodo-actions .dshtodo-icon-btn{opacity:1}
.dshtodo-tabs{flex:none;display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshtodo-tab{flex:1;height:26px;padding:0 8px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer;transition:background .15s ease,color .15s ease}
.dshtodo-tab:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent)}
.dshtodo-tab.is-active{background:color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent);color:var(--dsw-alias-label-primary);font-weight:600}
.dshtodo-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshtodo-body{flex:1;min-height:0;overflow-y:auto;padding:2px 0 6px}
.dshtodo-section{display:flex;flex-direction:column}
.dshtodo-section-head{display:flex;align-items:center;gap:6px;width:100%;padding:7px 12px;border:none;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;text-align:left}
.dshtodo-section-head:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent)}
.dshtodo-section-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dshtodo-chevron{display:inline-flex;transition:transform .15s ease;transform:rotate(0deg)}
.dshtodo-chevron.is-open{transform:rotate(90deg)}
.dshtodo-section-count{margin-left:auto;font-weight:500;color:var(--dsw-alias-label-secondary);opacity:.8}
.dshtodo-list{list-style:none;margin:0;padding:0 6px;display:flex;flex-direction:column;gap:1px}
.dshtodo-item{display:flex;align-items:flex-start;gap:8px;padding:7px 4px 7px 8px;border-radius:8px}
.dshtodo-item:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent)}
.dshtodo-check{flex:none;width:16px;height:16px;margin-top:1px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:5px;background:transparent;color:var(--dsw-alias-bg-base);display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.dshtodo-check:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshtodo-item.is-done .dshtodo-check{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.dshtodo-item-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;cursor:pointer;border-radius:6px;outline:none}
.dshtodo-item-main:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshtodo-item-main:hover .dshtodo-text{color:var(--dsw-alias-label-primary)}
.dshtodo-text{font-size:12.5px;line-height:1.42;word-break:break-word}
.dshtodo-item.is-done .dshtodo-text{color:var(--dsw-alias-label-secondary);text-decoration:line-through}
.dshtodo-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.dshtodo-chip{display:inline-flex;align-items:center;gap:3px;max-width:180px;overflow:hidden;white-space:nowrap}
.dshtodo-chip-text{overflow:hidden;text-overflow:ellipsis}
.dshtodo-chip-btn{padding:0;border:none;background:transparent;color:inherit;font-family:inherit;font-size:10.5px;cursor:pointer}
.dshtodo-chip-btn:hover{color:var(--dsw-alias-label-primary)}
.dshtodo-due.is-overdue{color:var(--dsw-alias-state-warn-primary)}
.dshtodo-empty{margin:0;padding:12px 14px;font-size:11.5px;text-align:center;color:var(--dsw-alias-label-secondary)}
.dshtodo-more{align-self:center;margin:6px 0 4px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11px;cursor:pointer}
.dshtodo-more:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary)}
.dshtodo-form{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:12px 14px 14px}
.dshtodo-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.dshtodo-label{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-input,.dshtodo-textarea{width:100%;box-sizing:border-box;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:12px;outline:none}
.dshtodo-input{height:30px}
.dshtodo-textarea{min-height:62px;padding:7px 10px;resize:vertical;line-height:1.45}
.dshtodo-input::placeholder,.dshtodo-textarea::placeholder{color:var(--dsw-alias-label-secondary);opacity:.75}
.dshtodo-input:focus,.dshtodo-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.dshtodo-file-row{display:flex;align-items:center;gap:8px;padding:5px 4px 5px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px}
.dshtodo-file-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11.5px;color:var(--dsw-alias-label-primary)}
.dshtodo-ghost{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;height:28px;padding:0 10px;border:1px dashed var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;cursor:pointer}
.dshtodo-ghost:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}
.dshtodo-form-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:2px}
.dshtodo-primary{height:30px;padding:0 14px;border:none;border-radius:8px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer}
.dshtodo-primary:disabled{opacity:.4;cursor:default}
.dshtodo-secondary{height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer}
.dshtodo-secondary:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dshtodo-pomo-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;height:24px;min-width:24px;padding:0 5px;margin-right:2px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;font-weight:600;font-variant-numeric:tabular-nums;cursor:pointer}
.dshtodo-pomo-btn:hover{background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent));color:var(--dsw-alias-label-primary)}
.dshtodo-pomo-btn.is-running{color:var(--dsw-alias-brand-primary)}
.dshtodo-pomo-page{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 14px 12px}
.dshtodo-pomo-clock{font-size:34px;font-weight:600;line-height:1.15;font-variant-numeric:tabular-nums;letter-spacing:.01em;color:var(--dsw-alias-label-primary)}
.dshtodo-pomo-page.is-running .dshtodo-pomo-clock{color:var(--dsw-alias-brand-primary)}
.dshtodo-pomo-phase{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dshtodo-pomo-settings{width:100%;display:flex;flex-direction:column;gap:7px;margin-top:6px}
.dshtodo-pomo-row{display:flex;align-items:center;gap:8px}
.dshtodo-pomo-row>.dshtodo-label{width:56px;flex:none}
.dshtodo-chips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;flex:1;min-width:0}
.dshtodo-chipbtn{height:24px;min-width:32px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:11.5px;cursor:pointer}
.dshtodo-chipbtn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.dshtodo-chipbtn.is-active{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-weight:600}
.dshtodo-chipbtn:disabled{opacity:.45;cursor:default}
.dshtodo-pomo-value{min-width:20px;text-align:center;font-size:12px;color:var(--dsw-alias-label-primary)}
.dshtodo-pomo-actions{display:flex;gap:8px;width:100%;justify-content:center;margin-top:6px}
`;

    // --- icons -------------------------------------------------------------

    function svg(props, children) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: props.size || 16,
          height: props.size || 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.width || 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        children,
      );
    }

    function ChecklistIcon(props) {
      return svg(
        { size: props && props.size },
        [
          h('path', { key: 'a', d: 'M2.4 4.3l1.4 1.4 2.3-2.6' }),
          h('path', { key: 'b', d: 'M9 5h4.6' }),
          h('path', { key: 'c', d: 'M2.4 10.5l1.4 1.4 2.3-2.6' }),
          h('path', { key: 'd', d: 'M9 11.1h4.6' }),
        ],
      );
    }

    function CheckMark() {
      return h(
        'svg',
        {
          viewBox: '0 0 12 12',
          width: 11,
          height: 11,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M2.4 6.3l2.3 2.3 4.9-5.2' }),
      );
    }

    function CloseIcon(props) {
      return svg({ size: (props && props.size) || 12, width: 1.6 }, [
        h('path', { key: 'x', d: 'M3.2 3.2l9.6 9.6M12.8 3.2l-9.6 9.6' }),
      ]);
    }

    function PlusIcon() {
      return svg({ size: 15, width: 1.7 }, [
        h('path', { key: 'h', d: 'M8 3.4v9.2' }),
        h('path', { key: 'v', d: 'M3.4 8h9.2' }),
      ]);
    }

    function ChevronIcon() {
      return svg({ size: 12, width: 1.8 }, [h('path', { key: 'c', d: 'M6 3.5l4 4.5-4 4.5' })]);
    }

    function BackIcon() {
      return svg({ size: 14, width: 1.7 }, [h('path', { key: 'b', d: 'M9.5 3.5L5 8l4.5 4.5' })]);
    }

    function PaperclipIcon() {
      return svg({ size: 11, width: 1.5 }, [
        h('path', {
          key: 'p',
          d: 'M10.6 7.6l-3 3a2.6 2.6 0 01-3.7-3.7l3.6-3.6a1.8 1.8 0 012.5 2.5l-3.6 3.6a.9.9 0 01-1.3-1.3l3.2-3.2',
        }),
      ]);
    }

    function TrashIcon() {
      return svg({ size: 12, width: 1.5 }, [
        h('path', { key: 'a', d: 'M3 4.5h10' }),
        h('path', { key: 'b', d: 'M6.2 4.5V3.2h3.6v1.3' }),
        h('path', { key: 'c', d: 'M4.4 4.5l.6 8h6l.6-8' }),
      ]);
    }

    function TimerIcon() {
      return svg({ size: 14, width: 1.6 }, [
        h('circle', { key: 'c', cx: 8, cy: 8.6, r: 5.1 }),
        h('path', { key: 'h', d: 'M8 5.9v2.9l1.9 1.3' }),
        h('path', { key: 't', d: 'M6.2 2.4h3.6' }),
      ]);
    }

    // --- storage -----------------------------------------------------------

    function readStored(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function writeStored(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        /* private mode or storage disabled: keep working in memory */
      }
    }

    function nextId() {
      return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function readAttachment(value) {
      if (!value || typeof value.name !== 'string' || !value.name) return null;
      return {
        name: value.name,
        size: Number.isFinite(value.size) ? value.size : 0,
        type: typeof value.type === 'string' ? value.type : '',
        stored: Boolean(value.stored),
      };
    }

    function readItems() {
      const raw = readStored(STORAGE_ITEMS);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const items = [];
        for (const entry of parsed) {
          if (!entry) continue;
          const title =
            typeof entry.title === 'string'
              ? entry.title
              : typeof entry.text === 'string'
                ? entry.text
                : '';
          const clean = title.trim();
          if (!clean) continue;
          items.push({
            id: typeof entry.id === 'string' && entry.id ? entry.id : nextId(),
            title: clean,
            detail: typeof entry.detail === 'string' ? entry.detail : '',
            due: typeof entry.due === 'string' && entry.due ? entry.due : null,
            createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : Date.now(),
            done: Boolean(entry.done),
            completedAt: Number.isFinite(entry.completedAt) ? entry.completedAt : null,
            attachment: readAttachment(entry.attachment),
          });
        }
        return items;
      } catch (error) {
        return [];
      }
    }

    function readSnap(value, horizontal) {
      const allowed = horizontal ? ['left', 'right'] : ['top', 'bottom'];
      return allowed.indexOf(value) >= 0 ? value : null;
    }

    function readPosition() {
      const raw = readStored(STORAGE_POSITION);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
          return {
            left: parsed.left,
            top: parsed.top,
            snapX: readSnap(parsed.snapX, true),
            snapY: readSnap(parsed.snapY, false),
          };
        }
      } catch (error) {
        /* fall back to the default corner */
      }
      return null;
    }

    /** Re-derives a stored position for the current viewport, keeping docked edges. */
    function anchorPosition(position, width, height) {
      const centredLeft = clamp(
        position.left,
        EDGE_MARGIN,
        Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN),
      );
      const centredTop = clamp(position.top, 8, Math.max(8, window.innerHeight - 80));
      let left = centredLeft;
      let top = centredTop;
      if (position.snapX === 'right') {
        left = Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN);
      } else if (position.snapX === 'left') {
        left = EDGE_MARGIN;
      }
      if (position.snapY === 'bottom') {
        top = Math.max(8, window.innerHeight - height - EDGE_MARGIN);
      } else if (position.snapY === 'top') {
        top = EDGE_MARGIN;
      }
      return { left, top, snapX: position.snapX || null, snapY: position.snapY || null };
    }

    /** Minimal shared store so the sidebar button and the panel agree. */
    function createStore(initial, persist) {
      let value = initial;
      const listeners = new Set();
      const store = {
        get: () => value,
        set: (next) => {
          value = typeof next === 'function' ? next(value) : next;
          persist(value);
          for (const listener of listeners) listener();
        },
        subscribe: (listener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        use: () => {
          const [snapshot, setSnapshot] = React.useState(value);
          React.useEffect(() => store.subscribe(() => setSnapshot(store.get())), []);
          return [snapshot, store.set];
        },
      };
      return store;
    }

    // --- attachments (IndexedDB keeps blobs out of localStorage) ------------

    function openDb() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error('IndexedDB unavailable'));
          return;
        }
        const request = window.indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function dbPut(key, value) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }

    async function dbGet(key) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const request = tx.objectStore(DB_STORE).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    async function dbDelete(key) {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    }

    async function putAttachment(key, file) {
      try {
        await dbPut(key, file);
        return true;
      } catch (error) {
        console.error('[todo-panel] attachment could not be stored', error);
        return false;
      }
    }

    function deleteAttachment(key) {
      dbDelete(key).catch(() => {
        /* nothing to clean up */
      });
    }

    const openStore = createStore(readStored(STORAGE_OPEN) !== '0', (open) =>
      writeStored(STORAGE_OPEN, open ? '1' : '0'),
    );
    const itemsStore = createStore(readItems(), (items) =>
      writeStored(STORAGE_ITEMS, JSON.stringify(items)),
    );

    // --- pomodoro ----------------------------------------------------------

    const POMO_DEFAULTS = {
      focus: 30,
      breakMinutes: 5,
      rounds: 4,
      phase: 'idle',
      endsAt: null,
      pausedLeft: null,
      completed: 0,
    };

    function readPomodoro() {
      const state = { ...POMO_DEFAULTS };
      const raw = readStored(STORAGE_POMODORO);
      if (!raw) return state;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return state;
        const num = (value, fallback, min, max) =>
          Number.isFinite(value) ? clamp(value, min, max) : fallback;
        state.focus = num(parsed.focus, state.focus, 1, 180);
        state.breakMinutes = num(parsed.breakMinutes, state.breakMinutes, 1, 60);
        state.rounds = num(parsed.rounds, state.rounds, 1, 24);
        state.completed = num(parsed.completed, 0, 0, 99);
        state.phase = parsed.phase === 'focus' || parsed.phase === 'break' ? parsed.phase : 'idle';
        state.endsAt = state.phase === 'idle' ? null : Number.isFinite(parsed.endsAt) ? parsed.endsAt : null;
        state.pausedLeft =
          state.phase === 'idle' || !Number.isFinite(parsed.pausedLeft) ? null : parsed.pausedLeft;
        return state;
      } catch (error) {
        return state;
      }
    }

    const pomodoroStore = createStore(readPomodoro(), (state) =>
      writeStored(STORAGE_POMODORO, JSON.stringify(state)),
    );

    function pomoLengthMs(state, phase) {
      const minutes = phase === 'break' ? state.breakMinutes : state.focus;
      return Math.max(1, minutes) * 60000;
    }

    function pomoRemainingMs(state, now) {
      if (state.endsAt) return Math.max(0, state.endsAt - now);
      if (Number.isFinite(state.pausedLeft) && state.pausedLeft !== null) {
        return Math.max(0, state.pausedLeft);
      }
      return pomoLengthMs(state, state.phase === 'break' ? 'break' : 'focus');
    }

    function formatClock(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    function ensurePomodoroPermission() {
      try {
        if (typeof window.Notification !== 'function') return;
        if (window.Notification.permission === 'default') {
          // Ask while a user gesture is still on the stack.
          window.Notification.requestPermission().catch(() => {});
        }
      } catch (error) {
        /* notifications are optional */
      }
    }

    /** Windows toast through the renderer's Web Notifications support. */
    function notifyPomodoro(body) {
      try {
        if (typeof window === 'undefined' || typeof window.Notification !== 'function') return;
        const fire = () => {
          try {
            new window.Notification(translate('pomoNotification'), {
              body,
              tag: 'todo-panel-pomodoro',
            });
          } catch (error) {
            console.error('[todo-panel] notification could not be shown', error);
          }
        };
        if (window.Notification.permission === 'granted') fire();
        else if (window.Notification.permission !== 'denied') {
          window.Notification.requestPermission().then((permission) => {
            if (permission === 'granted') fire();
          }, () => {});
        }
      } catch (error) {
        console.error('[todo-panel] notification unavailable', error);
      }
    }

    function pomoStart() {
      const state = pomodoroStore.get();
      if (state.endsAt) return;
      ensurePomodoroPermission();
      const fresh = state.phase === 'idle';
      const phase = fresh ? 'focus' : state.phase;
      const left = fresh ? pomoLengthMs(state, 'focus') : pomoRemainingMs(state, Date.now());
      pomodoroStore.set({
        ...state,
        phase,
        completed: fresh ? 0 : state.completed,
        endsAt: Date.now() + left,
        pausedLeft: null,
      });
    }

    function pomoPause() {
      const state = pomodoroStore.get();
      if (!state.endsAt) return;
      pomodoroStore.set({
        ...state,
        pausedLeft: Math.max(0, state.endsAt - Date.now()),
        endsAt: null,
      });
    }

    function pomoReset() {
      const state = pomodoroStore.get();
      pomodoroStore.set({ ...state, phase: 'idle', endsAt: null, pausedLeft: null, completed: 0 });
    }

    /** Settings only apply between runs, so the countdown cannot shift under the user. */
    function pomoConfigure(patch) {
      const state = pomodoroStore.get();
      if (state.phase !== 'idle' || state.endsAt) return;
      pomodoroStore.set({ ...state, ...patch });
    }

    function pomoAdvance() {
      const state = pomodoroStore.get();
      const now = Date.now();
      if (state.phase === 'focus') {
        const completed = state.completed + 1;
        if (completed >= state.rounds) {
          pomodoroStore.set({
            ...state,
            phase: 'idle',
            completed: 0,
            endsAt: null,
            pausedLeft: null,
          });
          notifyPomodoro(translate('pomoAllDone'));
          return;
        }
        pomodoroStore.set({
          ...state,
          phase: 'break',
          completed,
          endsAt: now + pomoLengthMs(state, 'break'),
          pausedLeft: null,
        });
        notifyPomodoro(
          translate('pomoFocusDone') +
            ' · ' +
            translate('pomoBreak') +
            ' ' +
            state.breakMinutes +
            ' ' +
            translate('pomoMinute'),
        );
        return;
      }
      if (state.phase === 'break') {
        pomodoroStore.set({
          ...state,
          phase: 'focus',
          endsAt: now + pomoLengthMs(state, 'focus'),
          pausedLeft: null,
        });
        notifyPomodoro(
          translate('pomoBreakDone') +
            ' · ' +
            translate('pomoFocus') +
            ' ' +
            state.focus +
            ' ' +
            translate('pomoMinute'),
        );
      }
    }

    /** Runs whether or not the panel is mounted, so phase ends still notify. */
    function pomoTick() {
      const state = pomodoroStore.get();
      if (!state.endsAt || state.phase === 'idle') return;
      if (Date.now() < state.endsAt) return;
      pomoAdvance();
    }

    // --- locale plumbing ---------------------------------------------------

    let activeLocale = null;

    function localeLanguage(locale) {
      if (!locale) return 'zh';
      let active = 'zh';
      try {
        const snapshot =
          typeof locale.getSnapshot === 'function'
            ? locale.getSnapshot()
            : typeof locale.getLocale === 'function'
              ? locale.getLocale()
              : null;
        if (snapshot && typeof snapshot.active === 'string' && snapshot.active) {
          active = snapshot.active;
        }
      } catch (error) {
        active = 'zh';
      }
      const base = active.toLowerCase().split('-')[0];
      return DICTS[base] ? base : 'zh';
    }

    /**
     * Resolve from the active locale's base language directly. Asking the
     * locale service to translate would walk its fallback chain — an unregistered
     * `zh` there falls through to `en`, which is how the panel ended up English
     * on a Chinese UI.
     */
    function translate(key) {
      const dict = DICTS[localeLanguage(activeLocale)] || DICTS.zh;
      return dict[key] || DICTS.zh[key] || key;
    }

    function useLocaleVersion() {
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        if (!activeLocale || typeof activeLocale.subscribe !== 'function') return undefined;
        return activeLocale.subscribe(() => bump((value) => value + 1));
      }, []);
    }

    // --- helpers -----------------------------------------------------------

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function startOfToday() {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }

    function isDueToday(item) {
      if (!item.due) return false;
      const time = new Date(item.due).getTime();
      if (!Number.isFinite(time)) return false;
      const start = startOfToday();
      return time >= start && time < start + 86400000;
    }

    function isOverdue(item) {
      if (item.done || !item.due) return false;
      const time = new Date(item.due).getTime();
      return Number.isFinite(time) && time < Date.now();
    }

    function dueTime(item) {
      if (!item.due) return Number.POSITIVE_INFINITY;
      const time = new Date(item.due).getTime();
      return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    }

    function sortPendingFirst(a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const byDue = dueTime(a) - dueTime(b);
      if (byDue !== 0) return byDue;
      return a.createdAt - b.createdAt;
    }

    function sortByCompleted(a, b) {
      const left = b.completedAt || b.createdAt;
      const right = a.completedAt || a.createdAt;
      return left - right;
    }

    function formatDue(due) {
      const date = new Date(due);
      if (!Number.isFinite(date.getTime())) return '';
      const locale = localeLanguage(activeLocale) === 'zh' ? 'zh-CN' : 'en-US';
      const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      const now = new Date();
      const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
      if (sameDay) return translate('todayShort') + ' ' + time;
      return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' }) + ' ' + time;
    }

    function formatSize(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
      return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    // --- sidebar toggle ----------------------------------------------------

    function TodoButton(props) {
      useLocaleVersion();
      const [open, setOpen] = openStore.use();
      const [items] = itemsStore.use();
      const t = translate;
      const remaining = items.filter((item) => !item.done).length;
      // The sidebar passes `wide` for the expanded column (rows with a label)
      // and false for the 56px rail (icon only), like the shipped footer rows.
      const wide = Boolean(props && props.wide);
      const hint = open ? t('closePanel') : t('openPanel');

      return h(
        'button',
        {
          type: 'button',
          className: 'dshtodo-btn' + (wide ? ' is-row' : '') + (open ? ' is-open' : ''),
          title: hint,
          'aria-label': t('title'),
          'aria-pressed': open,
          onClick: () => setOpen(!open),
        },
        h('style', null, CSS),
        h(ChecklistIcon, { size: wide ? 18 : 17 }),
        wide ? h('span', { className: 'dshtodo-btn-label' }, t('title')) : null,
        wide && remaining > 0
          ? h('span', { className: 'dshtodo-btn-count' }, String(remaining))
          : null,
        !wide && remaining > 0
          ? h('span', { className: 'dshtodo-btn-badge' }, String(remaining))
          : null,
      );
    }

    // --- pomodoro page -----------------------------------------------------

    /** Re-renders while a phase runs, so a countdown can be displayed. */
    function usePomodoroRemaining(state) {
      const running = Boolean(state.endsAt);
      const [, bump] = React.useState(0);
      React.useEffect(() => {
        if (!running) return undefined;
        const id = window.setInterval(() => bump((value) => value + 1), 500);
        return () => window.clearInterval(id);
      }, [running]);
      return pomoRemainingMs(state, Date.now());
    }

    function PomodoroPage() {
      useLocaleVersion();
      const [state] = pomodoroStore.use();
      const t = translate;
      const remaining = usePomodoroRemaining(state);
      const running = Boolean(state.endsAt);
      const idle = state.phase === 'idle';
      const phaseLabel = idle
        ? t('pomoReady')
        : state.phase === 'break'
          ? t('pomoBreak')
          : t('pomoFocus') + ' ' + Math.min(state.completed + 1, state.rounds) + '/' + state.rounds;

      const chips = (choices, active, onPick) =>
        h(
          'div',
          { className: 'dshtodo-chips' },
          choices.map((value) =>
            h(
              'button',
              {
                key: value,
                type: 'button',
                className: 'dshtodo-chipbtn' + (active === value ? ' is-active' : ''),
                disabled: !idle,
                onClick: () => onPick(value),
              },
              String(value),
            ),
          ),
        );

      return h(
        'div',
        { className: 'dshtodo-pomo-page' + (running ? ' is-running' : '') },
        h('div', { className: 'dshtodo-pomo-clock' }, formatClock(remaining)),
        h('div', { className: 'dshtodo-pomo-phase' }, phaseLabel),
        h(
          'div',
          { className: 'dshtodo-pomo-settings' },
          h(
            'div',
            { className: 'dshtodo-pomo-row' },
            h('span', { className: 'dshtodo-label' }, t('pomoDuration')),
            chips(POMO_FOCUS_CHOICES, state.focus, (value) => pomoConfigure({ focus: value })),
          ),
          h(
            'div',
            { className: 'dshtodo-pomo-row' },
            h('span', { className: 'dshtodo-label' }, t('pomoRounds')),
            h(
              'div',
              { className: 'dshtodo-chips' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-chipbtn',
                  disabled: !idle,
                  onClick: () => pomoConfigure({ rounds: Math.max(1, state.rounds - 1) }),
                },
                '−',
              ),
              h('span', { className: 'dshtodo-pomo-value' }, String(state.rounds)),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-chipbtn',
                  disabled: !idle,
                  onClick: () => pomoConfigure({ rounds: Math.min(12, state.rounds + 1) }),
                },
                '+',
              ),
            ),
          ),
          h(
            'div',
            { className: 'dshtodo-pomo-row' },
            h('span', { className: 'dshtodo-label' }, t('pomoBreakLen')),
            chips(POMO_BREAK_CHOICES, state.breakMinutes, (value) =>
              pomoConfigure({ breakMinutes: value }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'dshtodo-pomo-actions' },
          h(
            'button',
            {
              type: 'button',
              className: 'dshtodo-primary',
              onClick: () => (running ? pomoPause() : pomoStart()),
            },
            running ? t('pomoPause') : t('pomoStart'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dshtodo-secondary',
              disabled: idle,
              onClick: pomoReset,
            },
            t('pomoReset'),
          ),
        ),
      );
    }

    // --- item form (create and edit share it) ------------------------------

    function ItemForm(props) {
      useLocaleVersion();
      const t = translate;
      const initial = props.initial || null;
      const [title, setTitle] = React.useState(initial ? initial.title : '');
      const [detail, setDetail] = React.useState(initial ? initial.detail : '');
      const [due, setDue] = React.useState(
        initial && initial.due ? String(initial.due).slice(0, 16) : '',
      );
      const [file, setFile] = React.useState(null);
      const [attachment, setAttachment] = React.useState(initial ? initial.attachment : null);
      const [saving, setSaving] = React.useState(false);
      const fileRef = React.useRef(null);
      const submitting = React.useRef(false);
      const alive = React.useRef(true);

      React.useEffect(
        () => () => {
          alive.current = false;
        },
        [],
      );

      const submit = async () => {
        const name = title.trim();
        if (!name || submitting.current) return;
        submitting.current = true;
        setSaving(true);

        let nextAttachment = attachment;
        if (file) {
          nextAttachment = {
            name: file.name,
            size: file.size,
            type: file.type || '',
            stored: await putAttachment(props.id, file),
          };
        }
        if (!alive.current) {
          // Cancelled while the attachment was being written.
          if (file) deleteAttachment(props.id);
          return;
        }
        if (!nextAttachment && initial && initial.attachment) {
          // The stored file is now orphaned.
          deleteAttachment(props.id);
        }
        props.onSubmit({
          title: name,
          detail: detail.trim(),
          due: due || null,
          attachment: nextAttachment,
        });
      };

      const shown = file || attachment;

      return h(
        'form',
        {
          className: 'dshtodo-form',
          onSubmit: (event) => {
            event.preventDefault();
            submit();
          },
        },
        h(
          'label',
          { className: 'dshtodo-field' },
          h('span', { className: 'dshtodo-label' }, t('fieldTitle')),
          h('input', {
            className: 'dshtodo-input',
            value: title,
            autoFocus: true,
            placeholder: t('titlePlaceholder'),
            onChange: (event) => setTitle(event.target.value),
          }),
        ),
        h(
          'label',
          { className: 'dshtodo-field' },
          h('span', { className: 'dshtodo-label' }, t('fieldDetail')),
          h('textarea', {
            className: 'dshtodo-textarea',
            rows: 3,
            value: detail,
            placeholder: t('detailPlaceholder'),
            onChange: (event) => setDetail(event.target.value),
          }),
        ),
        h(
          'label',
          { className: 'dshtodo-field' },
          h('span', { className: 'dshtodo-label' }, t('fieldDue')),
          h('input', {
            type: 'datetime-local',
            className: 'dshtodo-input',
            value: due,
            onChange: (event) => setDue(event.target.value),
          }),
        ),
        h(
          'div',
          { className: 'dshtodo-field' },
          h('span', { className: 'dshtodo-label' }, t('fieldAttachment')),
          shown
            ? h(
                'div',
                { className: 'dshtodo-file-row' },
                h('span', { className: 'dshtodo-file-name', title: shown.name }, shown.name),
                h('span', { className: 'dshtodo-label' }, formatSize(shown.size)),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshtodo-icon-btn is-visible',
                    title: t('removeAttachment'),
                    'aria-label': t('removeAttachment'),
                    onClick: () => {
                      setFile(null);
                      setAttachment(null);
                    },
                  },
                  h(CloseIcon, { size: 11 }),
                ),
              )
            : h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-ghost',
                  onClick: () => {
                    if (fileRef.current) fileRef.current.click();
                  },
                },
                h(PaperclipIcon, null),
                h('span', null, t('addAttachment')),
              ),
          h('input', {
            type: 'file',
            ref: fileRef,
            style: { display: 'none' },
            onChange: (event) => {
              const picked = event.target.files && event.target.files[0];
              setFile(picked || null);
              event.target.value = '';
            },
          }),
        ),
        h(
          'div',
          { className: 'dshtodo-form-actions' },
          h(
            'button',
            { type: 'button', className: 'dshtodo-secondary', onClick: props.onCancel },
            t('cancel'),
          ),
          h(
            'button',
            {
              type: 'submit',
              className: 'dshtodo-primary',
              disabled: saving || title.trim() === '',
            },
            saving ? t('saving') : t('save'),
          ),
        ),
      );
    }

    // --- panel -------------------------------------------------------------

    function TodoPanel() {
      useLocaleVersion();
      const [items, setItems] = itemsStore.use();
      const [, setOpen] = openStore.use();
      const [pomodoro] = pomodoroStore.use();
      const t = translate;
      const pomoLeft = usePomodoroRemaining(pomodoro);
      const pomoActive = pomodoro.phase !== 'idle';

      const [formId, setFormId] = React.useState(null);
      const [editingId, setEditingId] = React.useState(null);
      const [pomoOpen, setPomoOpen] = React.useState(false);
      const [tab, setTab] = React.useState('home');
      const [expanded, setExpanded] = React.useState({
        today: true,
        more: true,
        open: true,
        done: true,
      });
      const [doneLimit, setDoneLimit] = React.useState(DONE_PAGE);

      const panelRef = React.useRef(null);
      const downloadRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const positionRef = React.useRef(readPosition());
      const [position, setPosition] = React.useState(positionRef.current);
      const [dragging, setDragging] = React.useState(false);

      React.useEffect(() => {
        const onResize = () => {
          const current = positionRef.current;
          if (!current) return;
          const element = panelRef.current;
          const width = element ? element.offsetWidth : 340;
          const height = element ? element.offsetHeight : 320;
          const next = anchorPosition(current, width, height);
          if (
            next.left !== current.left ||
            next.top !== current.top ||
            next.snapX !== current.snapX ||
            next.snapY !== current.snapY
          ) {
            positionRef.current = next;
            setPosition(next);
            writeStored(STORAGE_POSITION, JSON.stringify(next));
          }
        };
        window.addEventListener('resize', onResize);
        onResize();
        return () => window.removeEventListener('resize', onResize);
      }, []);

      const applyPosition = (left, top) => {
        const element = panelRef.current;
        const width = element ? element.offsetWidth : 340;
        const height = element ? element.offsetHeight : 320;
        const maxLeft = Math.max(8, window.innerWidth - width - 8);
        let nextLeft = clamp(left, 8, maxLeft);
        let nextTop = clamp(top, 8, Math.max(8, window.innerHeight - 80));
        let snapX = null;
        let snapY = null;

        const leftGap = nextLeft;
        const rightGap = window.innerWidth - (nextLeft + width);
        if (leftGap <= SNAP_THRESHOLD && leftGap <= rightGap) {
          nextLeft = EDGE_MARGIN;
          snapX = 'left';
        } else if (rightGap <= SNAP_THRESHOLD) {
          nextLeft = Math.max(8, window.innerWidth - width - EDGE_MARGIN);
          snapX = 'right';
        }

        const topGap = nextTop;
        const bottomGap = window.innerHeight - (nextTop + height);
        if (topGap <= SNAP_THRESHOLD && topGap <= bottomGap) {
          nextTop = EDGE_MARGIN;
          snapY = 'top';
        } else if (bottomGap <= SNAP_THRESHOLD) {
          nextTop = Math.max(8, window.innerHeight - height - EDGE_MARGIN);
          snapY = 'bottom';
        }

        const next = { left: nextLeft, top: nextTop, snapX, snapY };
        positionRef.current = next;
        setPosition(next);
        return next;
      };

      const onHeaderPointerDown = (event) => {
        if (event.button !== 0) return;
        if (
          event.target &&
          typeof event.target.closest === 'function' &&
          event.target.closest('button, input, textarea, a, label')
        ) {
          return;
        }
        const element = panelRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      };

      const onHeaderPointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag) return;
        applyPosition(event.clientX - drag.dx, event.clientY - drag.dy);
      };

      const onHeaderPointerUp = (event) => {
        const drag = dragRef.current;
        if (!drag) return;
        dragRef.current = null;
        // A fast flick can end between two pointermove frames, so the release
        // coordinates get the final say: recompute (with snapping) here.
        applyPosition(event.clientX - drag.dx, event.clientY - drag.dy);
        setDragging(false);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (error) {
          /* pointer already released */
        }
        if (positionRef.current) {
          writeStored(STORAGE_POSITION, JSON.stringify(positionRef.current));
        }
      };

      const resetPosition = () => {
        positionRef.current = null;
        setPosition(null);
        try {
          window.localStorage.removeItem(STORAGE_POSITION);
        } catch (error) {
          /* storage disabled: the CSS default still applies */
        }
      };

      const toggleDone = (id) => {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, done: !item.done, completedAt: item.done ? null : Date.now() }
              : item,
          ),
        );
      };

      const removeItem = (id) => {
        deleteAttachment(id);
        setItems((current) => current.filter((item) => item.id !== id));
      };

      const openAttachment = async (item) => {
        if (!item.attachment || !item.attachment.stored) return;
        try {
          const blob = await dbGet(item.id);
          const anchor = downloadRef.current;
          if (!blob || !anchor) return;
          const url = URL.createObjectURL(blob);
          anchor.href = url;
          anchor.download = item.attachment.name || 'attachment';
          anchor.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch (error) {
          console.error('[todo-panel] attachment could not be opened', error);
        }
      };

      const openCreate = () => {
        setEditingId(null);
        setFormId(nextId());
      };

      const openEdit = (item) => {
        setEditingId(item.id);
        setFormId(item.id);
      };

      const closeForm = () => {
        setFormId(null);
        setEditingId(null);
      };

      const submitForm = (patch) => {
        if (editingId) {
          setItems((current) =>
            current.map((item) => (item.id === editingId ? { ...item, ...patch } : item)),
          );
        } else {
          setItems((current) =>
            current.concat([
              {
                id: formId,
                title: patch.title,
                detail: patch.detail,
                due: patch.due,
                attachment: patch.attachment,
                createdAt: Date.now(),
                done: false,
                completedAt: null,
              },
            ]),
          );
          setTab('home');
        }
        setDoneLimit(DONE_PAGE);
        closeForm();
      };

      const renderRow = (item) =>
        h(
          'li',
          { key: item.id, className: 'dshtodo-item' + (item.done ? ' is-done' : '') },
          h(
            'button',
            {
              type: 'button',
              role: 'checkbox',
              'aria-checked': item.done,
              'aria-label': item.done ? t('markUndone') : t('markDone'),
              className: 'dshtodo-check',
              onClick: () => toggleDone(item.id),
            },
            item.done ? h(CheckMark, null) : null,
          ),
          h(
            'div',
            {
              className: 'dshtodo-item-main',
              role: 'button',
              tabIndex: 0,
              title: t('edit'),
              'aria-label': t('edit') + ' ' + item.title,
              onClick: () => openEdit(item),
              onKeyDown: (event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openEdit(item);
                }
              },
            },
            h('span', { className: 'dshtodo-text' }, item.title),
            item.due || item.attachment
              ? h(
                  'div',
                  { className: 'dshtodo-meta' },
                  item.due
                    ? h(
                        'span',
                        {
                          className:
                            'dshtodo-chip dshtodo-due' + (isOverdue(item) ? ' is-overdue' : ''),
                        },
                        formatDue(item.due),
                      )
                    : null,
                  item.attachment
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'dshtodo-chip dshtodo-chip-btn',
                          title: item.attachment.name,
                          onClick: (event) => {
                            event.stopPropagation();
                            openAttachment(item);
                          },
                        },
                        h(PaperclipIcon, null),
                        h('span', { className: 'dshtodo-chip-text' }, item.attachment.name),
                      )
                    : null,
                )
              : null,
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dshtodo-icon-btn dshtodo-remove',
              title: t('remove'),
              'aria-label': t('remove'),
              onClick: () => removeItem(item.id),
            },
            h(TrashIcon, null),
          ),
        );

      const renderSection = (key, label, list, footer) => {
        const isOpen = expanded[key] !== false;
        return h(
          'section',
          { key, className: 'dshtodo-section' },
          h(
            'button',
            {
              type: 'button',
              className: 'dshtodo-section-head',
              'aria-expanded': isOpen,
              onClick: () => setExpanded((current) => ({ ...current, [key]: !isOpen })),
            },
            h('span', { className: 'dshtodo-chevron' + (isOpen ? ' is-open' : '') }, h(ChevronIcon, null)),
            h('span', null, label),
            h('span', { className: 'dshtodo-section-count' }, String(list.length)),
          ),
          isOpen
            ? list.length === 0
              ? h('p', { className: 'dshtodo-empty' }, t('emptySection'))
              : h('ul', { className: 'dshtodo-list' }, list.map(renderRow))
            : null,
          isOpen && footer ? footer : null,
        );
      };

      const pending = items.filter((item) => !item.done);
      const summary = items.length ? String(pending.length) + ' ' + t('sectionOpen') : '';

      const todayItems = items.filter(isDueToday).sort(sortPendingFirst);
      const moreItems = items.filter((item) => !isDueToday(item)).sort(sortPendingFirst);
      const openItems = pending.slice().sort(sortPendingFirst);
      const doneItems = items.filter((item) => item.done).sort(sortByCompleted);
      const visibleDone = doneItems.slice(0, doneLimit);

      const listBody =
        tab === 'home'
          ? [
              renderSection('today', t('sectionToday'), todayItems),
              renderSection('more', t('sectionMore'), moreItems),
            ]
          : [
              renderSection('open', t('sectionOpen'), openItems),
              renderSection(
                'done',
                t('sectionDone'),
                visibleDone,
                doneItems.length > doneLimit
                  ? h(
                      'button',
                      {
                        type: 'button',
                        key: 'more-done',
                        className: 'dshtodo-more',
                        onClick: () => setDoneLimit((limit) => limit + DONE_MORE),
                      },
                      t('showMore'),
                    )
                  : null,
              ),
            ];

      const formOpen = formId !== null;
      const editingItem = editingId
        ? items.find((item) => item.id === editingId) || null
        : null;
      const floatingStyle = position
        ? { left: position.left + 'px', top: position.top + 'px', right: 'auto' }
        : null;

      return h(
        React.Fragment,
        null,
        h('style', null, CSS),
        h(
          'section',
          {
            ref: panelRef,
            className:
              'dshtodo-panel' +
              (position ? ' is-floating' : '') +
              (dragging ? ' is-dragging' : '') +
              (dragging && position && (position.snapX || position.snapY) ? ' is-snapped' : ''),
            style: floatingStyle,
            'aria-label': t('title'),
          },
          h(
            'header',
            {
              className: 'dshtodo-header',
              title: t('drag'),
              onPointerDown: onHeaderPointerDown,
              onPointerMove: onHeaderPointerMove,
              onPointerUp: onHeaderPointerUp,
              onPointerCancel: onHeaderPointerUp,
              onDoubleClick: resetPosition,
            },
            formOpen || pomoOpen
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dshtodo-icon-btn',
                    title: t('back'),
                    'aria-label': t('back'),
                    onClick: () => {
                      if (formOpen) closeForm();
                      else setPomoOpen(false);
                    },
                  },
                  h(BackIcon, null),
                )
              : null,
            h(
              'span',
              { className: 'dshtodo-title' },
              pomoOpen
                ? t('pomo')
                : formOpen
                  ? editingId
                    ? t('editTitle')
                    : t('newTitle')
                  : t('title'),
            ),
            h('span', { className: 'dshtodo-sub' }, formOpen || pomoOpen ? '' : summary),
            h(
              'div',
              { className: 'dshtodo-actions' },
              pomoOpen
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshtodo-pomo-btn' + (pomoActive ? ' is-running' : ''),
                      title: t('pomo'),
                      'aria-label': t('pomo'),
                      onClick: () => setPomoOpen(true),
                    },
                    pomoActive ? formatClock(pomoLeft) : h(TimerIcon, null),
                  ),
              formOpen || pomoOpen
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshtodo-icon-btn',
                      title: t('newTitle'),
                      'aria-label': t('newTitle'),
                      onClick: openCreate,
                    },
                    h(PlusIcon, null),
                  ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-icon-btn',
                  title: t('close'),
                  'aria-label': t('close'),
                  onClick: () => setOpen(false),
                },
                h(CloseIcon, { size: 11 }),
              ),
            ),
          ),
          pomoOpen
            ? h(PomodoroPage, null)
            : formOpen
            ? h(ItemForm, {
                key: formId,
                id: formId,
                initial: editingItem,
                onCancel: closeForm,
                onSubmit: submitForm,
              })
            : h(
                React.Fragment,
                null,
                h(
                  'div',
                  { className: 'dshtodo-tabs', role: 'tablist' },
                  h(
                    'button',
                    {
                      type: 'button',
                      role: 'tab',
                      'aria-selected': tab === 'home',
                      className: 'dshtodo-tab' + (tab === 'home' ? ' is-active' : ''),
                      onClick: () => setTab('home'),
                    },
                    t('tabHome'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      role: 'tab',
                      'aria-selected': tab === 'all',
                      className: 'dshtodo-tab' + (tab === 'all' ? ' is-active' : ''),
                      onClick: () => {
                        setDoneLimit(DONE_PAGE);
                        setTab('all');
                      },
                    },
                    t('tabAll'),
                  ),
                ),
                items.length === 0
                  ? h('p', { className: 'dshtodo-empty' }, t('emptyAll'))
                  : h('div', { className: 'dshtodo-body' }, listBody),
              ),
          h('a', { ref: downloadRef, style: { display: 'none' }, 'aria-hidden': true }),
        ),
      );
    }

    /** Renders the panel only while it is open. */
    function TodoPanelSeat() {
      const [open] = openStore.use();
      return open ? h(TodoPanel) : null;
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        const locale = ctx.get('locale');
        if (locale) {
          activeLocale = locale;
          if (typeof locale.register === 'function') {
            ctx.effect(() => {
              const disposers = [];
              // `zh` is the desktop app's own locale id; `zh-CN` covers web
              // profiles, and `en` keeps the panel usable on an English UI.
              for (const id of ['zh', 'zh-CN', 'en']) {
                const dict = id === 'en' ? DICTS.en : DICTS.zh;
                try {
                  disposers.push(locale.register(NS, id, dict));
                } catch (error) {
                  console.error('[todo-panel] locale dictionary registration failed', error);
                }
              }
              return () => {
                for (const dispose of disposers) {
                  try {
                    dispose();
                  } catch (error) {
                    /* already removed */
                  }
                }
              };
            });
          }
        }

        ctx.effect(() => {
          const id = window.setInterval(pomoTick, 1000);
          // Catch up on a phase that ended while the app was closed.
          pomoTick();
          return () => window.clearInterval(id);
        }, 'todo-panel: pomodoro ticker');

        ctx.effect(() => {
          // A hidden window throttles timers, so re-check the phase as soon as
          // the app is visible again instead of waiting for the next tick.
          const wake = () => pomoTick();
          document.addEventListener('visibilitychange', wake);
          window.addEventListener('focus', wake);
          return () => {
            document.removeEventListener('visibilitychange', wake);
            window.removeEventListener('focus', wake);
          };
        }, 'todo-panel: pomodoro wake');

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.footer.action',
              id: 'todo-panel-button',
              order: 5,
              label: () => translate('title'),
            },
            TodoButton,
          ),
        );

        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            {
              name: 'shell.overlay',
              id: 'todo-panel',
              order: 900,
              label: () => translate('title'),
            },
            TodoPanelSeat,
          ),
        );
      },
    };
  },
});
