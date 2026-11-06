window.__ModuleLoader__.load({
  id: 'dsh-better-todo',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'todo-panel';

    /** The Host half's state document; see index.js for the file behind it. */
    const STATE_URL = '/todo-panel/state';
    /** Host-side Windows toast, used when the page cannot show a notification. */
    const NOTIFY_URL = '/todo-panel/notify';
    /** Same endpoint on its own path, for a Host that already owns the prefix. */
    const NOTIFY_FALLBACK_URL = '/todo-panel-notify';
    /** Keys a previous version kept in localStorage, read once to migrate. */
    const LEGACY_ITEMS = 'dsh.todo-panel.items.v1';
    const LEGACY_OPEN = 'dsh.todo-panel.open.v1';
    const LEGACY_POSITION = 'dsh.todo-panel.position.v1';
    const LEGACY_POMODORO = 'dsh.todo-panel.pomodoro.v1';
    const LEGACY_DB_NAME = 'dsh-todo-panel';
    const LEGACY_DB_STORE = 'attachments';

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
    const POMO_FOCUS_RANGE = [1, 180];
    const POMO_BREAK_RANGE = [1, 120];

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
        openDetail: '查看详情',
        viewTitle: '待办详情',
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
        pomoCustom: '自定义',
        pomoStart: '开始',
        pomoPause: '暂停',
        pomoReset: '重置',
        pomoMinute: '分钟',
        pomoFocusDone: '专注结束，休息一下',
        pomoBreakDone: '休息结束，继续专注',
        pomoAllDone: '全部番茄完成 🎉',
        pomoNotification: '番茄钟',
        pomoFocusEnded: '专注结束',
        pomoBreakEnded: '休息结束',
        pomoStartBreak: '开始休息',
        pomoStartFocus: '开始专注',
        pomoResume: '继续',
        pomoLater: '稍后',
        pomoPausedTag: '已暂停',
        pomoBreakHint: '休息 {n} 分钟',
        pomoFocusHint: '专注 {n} 分钟',
        pomoTest: '测试通知',
        pomoTestOk: '已发送测试通知',
        pomoTestFail: '通知没能发出',
        pomoNoticeHint: '系统通知未开启，阶段结束只会在面板里提示',
        pomoEnableNotice: '开启通知',
        attachmentMissing: '附件已不可用',
        detailEmpty: '没有更多说明',
        previewImage: '点击放大查看',
        downloadFile: '点击下载',
        closePreview: '关闭',
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
        openDetail: 'View details',
        viewTitle: 'Todo details',
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
        pomoCustom: 'Custom',
        pomoStart: 'Start',
        pomoPause: 'Pause',
        pomoReset: 'Reset',
        pomoMinute: 'min',
        pomoFocusDone: 'Focus finished — take a break',
        pomoBreakDone: 'Break finished — back to focus',
        pomoAllDone: 'All pomodoros done 🎉',
        pomoNotification: 'Pomodoro',
        pomoFocusEnded: 'Focus finished',
        pomoBreakEnded: 'Break finished',
        pomoStartBreak: 'Start break',
        pomoStartFocus: 'Start focus',
        pomoResume: 'Resume',
        pomoLater: 'Later',
        pomoPausedTag: 'Paused',
        pomoBreakHint: 'Break {n} min',
        pomoFocusHint: 'Focus {n} min',
        pomoTest: 'Test notification',
        pomoTestOk: 'Test notification sent',
        pomoTestFail: 'Notification failed',
        pomoNoticeHint: 'System notifications are off — phase ends only show in the panel',
        pomoEnableNotice: 'Enable notifications',
        attachmentMissing: 'Attachment unavailable',
        detailEmpty: 'No further details',
        previewImage: 'Click to enlarge',
        downloadFile: 'Click to download',
        closePreview: 'Close',
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
.dshtodo-pomo-btn.is-waiting{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}
.dshtodo-pomo-btn.is-waiting:hover{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);opacity:.9}
.dshtodo-pomo-btn.is-paused{opacity:.65}
.dshtodo-pomo-toggle{margin-right:2px}
.dshtodo-alert{display:flex;flex-direction:column;gap:7px;margin:8px 10px 0;padding:9px 10px;border:1px solid var(--dsw-alias-brand-primary);border-radius:9px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
.dshtodo-alert-text{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dshtodo-alert-text>strong{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-primary)}
.dshtodo-alert-actions{display:flex;gap:8px}
.dshtodo-alert-actions>.dshtodo-primary,.dshtodo-alert-actions>.dshtodo-secondary{height:26px;font-size:11.5px}
.dshtodo-pomo-hint{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dshtodo-pomo-page.is-waiting .dshtodo-pomo-clock{color:var(--dsw-alias-brand-primary)}
.dshtodo-pomo-notice{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;justify-content:center}
.dshtodo-pomo-notice-text{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-linkbtn{padding:0;border:none;background:transparent;color:var(--dsw-alias-brand-primary);font-family:inherit;font-size:11px;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
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
.dshtodo-pomo-custom{margin-top:-3px}
.dshtodo-pomo-input{width:62px;height:26px;padding:0 8px;box-sizing:border-box;font-size:12px;font-variant-numeric:tabular-nums}
.dshtodo-pomo-input:disabled{color:var(--dsw-alias-label-secondary);background:transparent;cursor:not-allowed}
.dshtodo-pomo-unit{font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-pomo-actions{display:flex;gap:8px;width:100%;justify-content:center;margin-top:6px}
.dshtodo-text-btn{flex:none;height:22px;padding:0 7px;margin-right:2px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;cursor:pointer}
.dshtodo-text-btn:hover{background:var(--dsw-alias-interactive-bg-hover,color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent));color:var(--dsw-alias-label-primary)}
.dshtodo-detail{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:14px 14px 18px}
.dshtodo-detail-title{margin:0;font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary);word-break:break-word}
.dshtodo-detail-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.dshtodo-detail-chip{padding:1px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshtodo-detail-chip.is-done{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);border-color:transparent}
.dshtodo-detail-body{margin:0;font-size:12.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary)}
.dshtodo-detail-body.is-empty{color:var(--dsw-alias-label-secondary)}
.dshtodo-detail-file{display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}
.dshtodo-detail-file:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.dshtodo-lightbox{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:40px;background:rgba(0,0,0,.72);cursor:zoom-out}
.dshtodo-lightbox-img{max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.45);cursor:default}
.dshtodo-lightbox-close{position:fixed;top:16px;right:16px;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:none;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;cursor:pointer}
.dshtodo-lightbox-close:hover{background:rgba(255,255,255,.3)}
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

    function PauseIcon() {
      return svg({ size: 13, width: 1.8 }, [
        h('path', { key: 'a', d: 'M6.2 3.6v8.8' }),
        h('path', { key: 'b', d: 'M9.8 3.6v8.8' }),
      ]);
    }

    function PlayIcon() {
      return svg({ size: 12, width: 1.6 }, [
        h('path', { key: 'p', d: 'M5.4 3.6l6 4.4-6 4.4z' }),
      ]);
    }

    // --- legacy browser storage ---------------------------------------------
    // Earlier versions kept everything in localStorage and IndexedDB. The
    // desktop serves the page from a per-launch port, so that database belongs
    // to an origin that is gone after a restart; these readers exist only to
    // migrate what a still-running session has into the Host's document.

    function readLegacy(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    function removeLegacy(key) {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        /* private mode or storage disabled: nothing to clean up */
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

    /** Validates one stored item list, dropping entries without a title. */
    function parseItemsArray(parsed) {
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
    }

    function readItems() {
      const raw = readLegacy(LEGACY_ITEMS);
      if (!raw) return [];
      try {
        return parseItemsArray(JSON.parse(raw));
      } catch (error) {
        return [];
      }
    }

    function readSnap(value, horizontal) {
      const allowed = horizontal ? ['left', 'right'] : ['top', 'bottom'];
      return allowed.indexOf(value) >= 0 ? value : null;
    }

    function parsePosition(parsed) {
      if (parsed && Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) {
        return {
          left: parsed.left,
          top: parsed.top,
          snapX: readSnap(parsed.snapX, true),
          snapY: readSnap(parsed.snapY, false),
        };
      }
      return null;
    }

    function readPosition() {
      const raw = readLegacy(LEGACY_POSITION);
      if (!raw) return null;
      try {
        return parsePosition(JSON.parse(raw));
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

    // --- attachments --------------------------------------------------------
    // One file per item, carried inside the state document as a data URL so it
    // lives next to the item it belongs to (the Host caps a document at 32 MB).

    /** item id -> data URL, mirrored into the document on every save. */
    const attachmentFiles = new Map();

    function readFileDataUrl(file) {
      return new Promise((resolve, reject) => {
        if (typeof window.FileReader !== 'function') {
          reject(new Error('FileReader unavailable'));
          return;
        }
        const reader = new window.FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error || new Error('unreadable file'));
        reader.readAsDataURL(file);
      });
    }

    async function putAttachment(key, file) {
      try {
        attachmentFiles.set(key, await readFileDataUrl(file));
        scheduleSave();
        return true;
      } catch (error) {
        console.error('[todo-panel] attachment could not be stored', error);
        return false;
      }
    }

    function deleteAttachment(key) {
      if (attachmentFiles.delete(key)) scheduleSave();
    }

    function attachmentUrl(key) {
      return attachmentFiles.get(key) || null;
    }

    /** Reads a blob an earlier version left in IndexedDB, as a data URL. */
    function readLegacyAttachment(key) {
      return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };
        if (!window.indexedDB) {
          finish(null);
          return;
        }
        let request;
        try {
          request = window.indexedDB.open(LEGACY_DB_NAME, 1);
        } catch (error) {
          finish(null);
          return;
        }
        request.onerror = () => finish(null);
        request.onupgradeneeded = () => finish(null);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(LEGACY_DB_STORE)) {
            db.close();
            finish(null);
            return;
          }
          let read;
          try {
            read = db.transaction(LEGACY_DB_STORE, 'readonly').objectStore(LEGACY_DB_STORE).get(key);
          } catch (error) {
            db.close();
            finish(null);
            return;
          }
          read.onsuccess = () => {
            const blob = read.result;
            db.close();
            if (!blob || typeof blob !== 'object') {
              finish(null);
              return;
            }
            readFileDataUrl(blob).then(finish, () => finish(null));
          };
          read.onerror = () => {
            db.close();
            finish(null);
          };
        };
      });
    }

    const openStore = createStore(true, () => scheduleSave());
    const itemsStore = createStore([], () => scheduleSave());
    const positionStore = createStore(null, () => scheduleSave());

    // --- the state document -------------------------------------------------
    // One snapshot carries every store plus the attachment files. The Host half
    // writes it to disk; the page reads it once and re-posts after each change.

    /** False until the first load finished: placeholder state must not be saved. */
    let documentLoaded = false;
    /** Revision of the document this page last read or wrote. */
    let documentRev = 0;
    let saveTimer = null;
    let saveChain = Promise.resolve();
    /** True while a Host document is being merged in, so the merge does not save. */
    let applyingRemote = false;
    /** Saves in flight; a merge while one runs would resurrect a replaced item. */
    let saving = 0;
    /** Items created here that no save has carried to the Host yet. */
    const pendingCreateIds = new Set();

    function buildDocument() {
      const attachments = {};
      for (const [id, dataUrl] of attachmentFiles) attachments[id] = dataUrl;
      return {
        version: 1,
        // The revision this snapshot was built from; a Host that speaks the
        // protocol replaces it with `baseRev + 1` and ignores this field.
        rev: documentRev,
        savedAt: Date.now(),
        open: openStore.get(),
        items: itemsStore.get(),
        position: positionStore.get(),
        pomodoro: pomodoroStore.get(),
        attachments,
      };
    }

    /**
     * Merges a document another writer produced (an agent tool, or a panel in
     * another window). The page's own items win by id, anything only the other
     * writer knows is kept, and no save is scheduled here.
     */
    function mergeRemoteDocument(remote) {
      if (!remote || typeof remote !== 'object') return false;
      const rev = Number(remote.rev);
      if (Number.isFinite(rev)) documentRev = rev;
      const remoteItems = parseItemsArray(remote.items);
      applyingRemote = true;
      try {
        // The Host copy is the truth: it already carries every save this page
        // made. Only items created after the last successful save survive from
        // the local side, so a removed item cannot come back.
        const merged = new Map(remoteItems.map((item) => [item.id, item]));
        for (const item of itemsStore.get()) {
          if (!merged.has(item.id) && pendingCreateIds.has(item.id)) merged.set(item.id, item);
        }
        itemsStore.set(Array.from(merged.values()));
        const keptFiles = new Map(attachmentFiles);
        attachmentFiles.clear();
        const attachments = remote.attachments;
        if (attachments && typeof attachments === 'object') {
          for (const [id, value] of Object.entries(attachments)) {
            if (typeof value === 'string' && value !== '') attachmentFiles.set(id, value);
          }
        }
        for (const id of pendingCreateIds) {
          const value = keptFiles.get(id);
          if (value) attachmentFiles.set(id, value);
        }
      } finally {
        applyingRemote = false;
      }
      return true;
    }

    /** Debounced whole-document save; writes are serialised by an inner chain. */
    function scheduleSave() {
      if (!documentLoaded || applyingRemote) return;
      if (saveTimer !== null) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        saveTimer = null;
        saveChain = saveChain.then(() => postDocument()).catch((error) => {
          console.error('[todo-panel] state could not be saved', error);
        });
      }, 400);
    }

    /** Posts the current snapshot; a stale revision adopts the Host copy first. */
    async function postDocument(retry = true) {
      const body = JSON.stringify({ ...buildDocument(), baseRev: documentRev });
      saving += 1;
      let response;
      try {
        response = await fetch(STATE_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
        });
      } finally {
        saving -= 1;
      }
      if (response.status === 409) {
        const conflict = await response.json().catch(() => null);
        mergeRemoteDocument(conflict && conflict.document);
        // The user's own edits still have to land, so save once more on top of
        // the merged list; a second conflict is logged instead of looping.
        if (retry) await postDocument(false);
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json().catch(() => null);
      if (result && Number.isFinite(Number(result.rev))) documentRev = Number(result.rev);
      pendingCreateIds.clear();
    }

    /** Picks up changes an agent tool made while the panel sat idle. */
    async function pollRemoteDocument() {
      if (!documentLoaded || applyingRemote) return;
      if (saveTimer !== null || saving > 0) return;
      try {
        const response = await fetch(STATE_URL, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) return;
        const remote = await response.json();
        const rev = Number(remote && remote.rev);
        if (!Number.isFinite(rev) || rev <= documentRev) return;
        mergeRemoteDocument(remote);
      } catch (error) {
        /* the Host may be restarting; the next poll tries again */
      }
    }

    window.setInterval(pollRemoteDocument, 4000);

    /** Applies a document to the stores; persist calls are inert while loading. */
    function applyDocument(document) {
      if (!document || typeof document !== 'object') return;
      itemsStore.set(parseItemsArray(document.items));
      openStore.set(typeof document.open === 'boolean' ? document.open : true);
      positionStore.set(parsePosition(document.position));
      pomodoroStore.set(parsePomodoro(document.pomodoro));
      attachmentFiles.clear();
      const attachments = document.attachments;
      if (attachments && typeof attachments === 'object') {
        for (const [id, value] of Object.entries(attachments)) {
          if (typeof value === 'string' && value !== '') attachmentFiles.set(id, value);
        }
      }
    }

    /** Loads the Host document, migrating a browser-stored list the first time. */
    async function loadState() {
      let document = null;
      let failure = null;
      for (let attempt = 0; attempt < 2 && document === null; attempt += 1) {
        try {
          const response = await fetch(STATE_URL, {
            headers: { accept: 'application/json' },
            cache: 'no-store',
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const parsed = await response.json();
          if (!parsed || typeof parsed !== 'object') throw new Error('malformed state document');
          document = parsed;
        } catch (error) {
          failure = error;
          await new Promise((resolve) => window.setTimeout(resolve, 1500));
        }
      }

      // Saving without a readable document would replace real data with an
      // empty list, so a failed load leaves the panel read-only for this run.
      if (document === null) {
        console.error('[todo-panel] state could not be loaded; changes stay in memory', failure);
        return;
      }

      if (Array.isArray(document.items) && document.items.length > 0) {
        applyDocument(document);
        documentRev = Number(document.rev) || 0;
        documentLoaded = true;
        return;
      }

      const legacyItems = readItems();
      if (legacyItems.length > 0) {
        itemsStore.set(legacyItems);
        openStore.set(readLegacy(LEGACY_OPEN) !== '0');
        positionStore.set(readPosition());
        pomodoroStore.set(readPomodoro());
        for (const item of legacyItems) {
          if (!item.attachment || !item.attachment.stored) continue;
          const dataUrl = await readLegacyAttachment(item.id);
          if (dataUrl) attachmentFiles.set(item.id, dataUrl);
        }
        documentLoaded = true;
        for (const key of [LEGACY_ITEMS, LEGACY_OPEN, LEGACY_POSITION, LEGACY_POMODORO]) {
          removeLegacy(key);
        }
        scheduleSave();
        return;
      }

      applyDocument(document);
      documentRev = Number(document.rev) || 0;
      documentLoaded = true;
    }

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

    /**
     * `focus` and `break` count down; `focus-end` and `break-end` hold the
     * finished phase until the user starts the next one by hand, so a timer can
     * never steal attention that the user did not hand back.
     */
    const POMO_PHASES = ['idle', 'focus', 'break', 'focus-end', 'break-end'];

    /** Validates one stored timer snapshot, clamping every number. */
    function parsePomodoro(parsed) {
      const state = { ...POMO_DEFAULTS };
      if (!parsed || typeof parsed !== 'object') return state;
      const num = (value, fallback, min, max) =>
        Number.isFinite(value) ? clamp(value, min, max) : fallback;
      state.focus = num(parsed.focus, state.focus, POMO_FOCUS_RANGE[0], POMO_FOCUS_RANGE[1]);
      state.breakMinutes = num(
        parsed.breakMinutes,
        state.breakMinutes,
        POMO_BREAK_RANGE[0],
        POMO_BREAK_RANGE[1],
      );
      state.rounds = num(parsed.rounds, state.rounds, 1, 24);
      state.completed = num(parsed.completed, 0, 0, 99);
      state.phase = POMO_PHASES.indexOf(parsed.phase) >= 0 ? parsed.phase : 'idle';
      state.endsAt =
        (state.phase === 'focus' || state.phase === 'break') && Number.isFinite(parsed.endsAt)
          ? parsed.endsAt
          : null;
      state.pausedLeft =
        state.phase === 'idle' || !Number.isFinite(parsed.pausedLeft) ? null : parsed.pausedLeft;
      return state;
    }

    function readPomodoro() {
      const raw = readLegacy(LEGACY_POMODORO);
      if (!raw) return { ...POMO_DEFAULTS };
      try {
        return parsePomodoro(JSON.parse(raw));
      } catch (error) {
        return { ...POMO_DEFAULTS };
      }
    }

    const pomodoroStore = createStore({ ...POMO_DEFAULTS }, () => scheduleSave());

    function pomoLengthMs(state, phase) {
      const minutes = phase === 'break' ? state.breakMinutes : state.focus;
      return Math.max(1, minutes) * 60000;
    }

    function pomoRemainingMs(state, now) {
      if (state.endsAt) return Math.max(0, state.endsAt - now);
      if (pomoWaiting(state)) return 0;
      if (Number.isFinite(state.pausedLeft) && state.pausedLeft !== null) {
        return Math.max(0, state.pausedLeft);
      }
      return pomoLengthMs(state, state.phase === 'break' ? 'break' : 'focus');
    }

    /** A finished phase holding until the user starts the next one. */
    function pomoWaiting(state) {
      return state.phase === 'focus-end' || state.phase === 'break-end';
    }

    function pomoRunning(state) {
      return Boolean(state.endsAt);
    }

    function pomoPaused(state) {
      return !state.endsAt && !pomoWaiting(state) && Number.isFinite(state.pausedLeft);
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

    /** `granted` / `denied` / `default`, or `unsupported` where the API is absent. */
    function pomodoroPermission() {
      try {
        if (typeof window.Notification !== 'function') return 'unsupported';
        return window.Notification.permission;
      } catch (error) {
        return 'unsupported';
      }
    }

    /** Windows toast through the Host, for when the renderer cannot show one. */
    function notifyThroughHost(body) {
      try {
        const payload = JSON.stringify({ title: translate('pomoNotification'), body });
        const post = (url) =>
          fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: payload,
          });
        void post(notifyRoute)
          .then((response) => {
            // A Host that already owns the main prefix answers 404; its toast
            // endpoint lives on the fallback path until it restarts.
            if (response.status !== 404 || notifyRoute !== NOTIFY_URL) return undefined;
            notifyRoute = NOTIFY_FALLBACK_URL;
            return post(notifyRoute);
          })
          .catch(() => {});
      } catch (error) {
        /* the Host may not be able to reach a notifier either */
      }
    }

    /** Which of the two notify paths this page settled on. */
    let notifyRoute = NOTIFY_URL;

    /** Returns true when the renderer accepted a notification to display. */
    function showRendererNotification(body) {
      try {
        if (typeof window.Notification !== 'function') return false;
        if (window.Notification.permission !== 'granted') return false;
        new window.Notification(translate('pomoNotification'), {
          body,
          requireInteraction: true,
          tag: 'todo-panel-pomodoro-' + Date.now(),
        });
        return true;
      } catch (error) {
        console.error('[todo-panel] notification could not be shown', error);
        return false;
      }
    }

    function notifyPomodoro(body) {
      if (showRendererNotification(body)) return;
      notifyThroughHost(body);
    }

    function pomoStart() {
      const state = pomodoroStore.get();
      if (state.endsAt) return;
      ensurePomodoroPermission();
      const now = Date.now();
      if (state.phase === 'focus' || state.phase === 'break') {
        // Resume the paused countdown exactly where it stopped.
        pomodoroStore.set({ ...state, endsAt: now + pomoRemainingMs(state, now), pausedLeft: null });
        return;
      }
      const next = state.phase === 'focus-end' ? 'break' : 'focus';
      pomodoroStore.set({
        ...state,
        phase: next,
        endsAt: now + pomoLengthMs(state, next),
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

    /**
     * A countdown that reaches zero stops there and notifies; the next phase
     * starts only from {@link pomoStart}, which is the click the user expects.
     */
    function pomoFinish() {
      const state = pomodoroStore.get();
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
          phase: 'focus-end',
          completed,
          endsAt: null,
          pausedLeft: null,
        });
        notifyPomodoro(translate('pomoFocusDone'));
        revealPanel();
        return;
      }
      if (state.phase === 'break') {
        pomodoroStore.set({ ...state, phase: 'break-end', endsAt: null, pausedLeft: null });
        notifyPomodoro(translate('pomoBreakDone'));
        revealPanel();
      }
    }

    /** A finished timer is worthless behind a closed panel, so bring it back. */
    function revealPanel() {
      try {
        if (!openStore.get()) openStore.set(true);
      } catch (error) {
        /* the panel is optional */
      }
    }

    /** Runs whether or not the panel is mounted, so phase ends still notify. */
    function pomoTick() {
      const state = pomodoroStore.get();
      if (!state.endsAt || state.phase === 'idle') return;
      if (Date.now() < state.endsAt) return;
      pomoFinish();
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

    /** True for an attachment the panel can show inline instead of downloading. */
    function isImageAttachment(attachment) {
      if (!attachment) return false;
      const type = typeof attachment.type === 'string' ? attachment.type : '';
      if (/^image\//i.test(type)) return true;
      const name = typeof attachment.name === 'string' ? attachment.name : '';
      return /\.(png|jpe?g|gif|webp|bmp|svg|avif|ico)$/i.test(name);
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

    /**
     * One duration setting: preset chips plus a "Custom" chip that reveals a
     * minute field, so any value inside [min, max] can be typed in.
     */
    function DurationRow(props) {
      const t = translate;
      const [draft, setDraft] = React.useState(String(props.value));
      const [editing, setEditing] = React.useState(false);
      const preset = props.choices.indexOf(props.value) >= 0;
      const showField = editing || !preset;

      React.useEffect(() => {
        setDraft(String(props.value));
      }, [props.value]);

      const clamp = (parsed) => Math.min(props.max, Math.max(props.min, parsed));

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'dshtodo-pomo-row' },
          h('span', { className: 'dshtodo-label' }, props.label),
          h(
            'div',
            { className: 'dshtodo-chips' },
            props.choices.map((choice) =>
              h(
                'button',
                {
                  key: choice,
                  type: 'button',
                  className: 'dshtodo-chipbtn' + (props.value === choice ? ' is-active' : ''),
                  disabled: props.disabled,
                  onClick: () => {
                    setEditing(false);
                    if (choice !== props.value) props.onChange(choice);
                  },
                },
                String(choice),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dshtodo-chipbtn' + (preset ? '' : ' is-active'),
                disabled: props.disabled,
                onClick: () => setEditing(true),
              },
              t('pomoCustom'),
            ),
          ),
        ),
        showField
          ? h(
              'div',
              { className: 'dshtodo-pomo-row dshtodo-pomo-custom' },
              h('span', { className: 'dshtodo-label' }),
              h('input', {
                type: 'number',
                className: 'dshtodo-input dshtodo-pomo-input',
                min: props.min,
                max: props.max,
                step: 1,
                inputMode: 'numeric',
                value: draft,
                disabled: props.disabled,
                'aria-label': props.label,
                onChange: (event) => {
                  const raw = event.target.value;
                  setDraft(raw);
                  const parsed = Number.parseInt(raw, 10);
                  if (Number.isFinite(parsed) && parsed === clamp(parsed) && parsed !== props.value) {
                    props.onChange(parsed);
                  }
                },
                onBlur: () => {
                  const parsed = Number.parseInt(draft, 10);
                  if (!Number.isFinite(parsed)) {
                    setDraft(String(props.value));
                    return;
                  }
                  const next = clamp(parsed);
                  setDraft(String(next));
                  if (next !== props.value) props.onChange(next);
                },
              }),
              h('span', { className: 'dshtodo-pomo-unit' }, t('pomoMinute')),
            )
          : null,
      );
    }

    function PomodoroPage() {
      useLocaleVersion();
      const [state] = pomodoroStore.use();
      const t = translate;
      const remaining = usePomodoroRemaining(state);
      const running = Boolean(state.endsAt);
      const waiting = pomoWaiting(state);
      const paused = pomoPaused(state);
      const idle = state.phase === 'idle';
      const breakNext = state.phase === 'focus-end';
      const [notice, setNotice] = React.useState('');
      const phaseLabel = idle
        ? t('pomoReady')
        : state.phase === 'break' || state.phase === 'break-end'
          ? t('pomoBreak')
          : t('pomoFocus') + ' ' + Math.min(state.completed + 1, state.rounds) + '/' + state.rounds;
      const headline = waiting
        ? breakNext
          ? t('pomoFocusEnded')
          : t('pomoBreakEnded')
        : paused
          ? t('pomoPausedTag')
          : phaseLabel;
      const primaryLabel = running
        ? t('pomoPause')
        : waiting
          ? breakNext
            ? t('pomoStartBreak')
            : t('pomoStartFocus')
          : paused
            ? t('pomoResume')
            : t('pomoStart');
      const permission = pomodoroPermission();

      const testNotification = () => {
        const body = t('pomoTestOk');
        if (showRendererNotification(body)) {
          setNotice(t('pomoTestOk'));
          return;
        }
        notifyThroughHost(body);
        setNotice(t('pomoTestFail'));
      };

      return h(
        'div',
        { className: 'dshtodo-pomo-page' + (running ? ' is-running' : '') + (waiting ? ' is-waiting' : '') },
        h('div', { className: 'dshtodo-pomo-clock' }, formatClock(remaining)),
        h('div', { className: 'dshtodo-pomo-phase' }, headline),
        waiting
          ? h(
              'div',
              { className: 'dshtodo-pomo-hint' },
              breakNext
                ? t('pomoBreakHint').replace('{n}', String(state.breakMinutes))
                : t('pomoFocusHint').replace('{n}', String(state.focus)),
            )
          : null,
        h(
          'div',
          { className: 'dshtodo-pomo-settings' },
          h(DurationRow, {
            label: t('pomoDuration'),
            choices: POMO_FOCUS_CHOICES,
            value: state.focus,
            min: POMO_FOCUS_RANGE[0],
            max: POMO_FOCUS_RANGE[1],
            disabled: !idle,
            onChange: (value) => pomoConfigure({ focus: value }),
          }),
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
          h(DurationRow, {
            label: t('pomoBreakLen'),
            choices: POMO_BREAK_CHOICES,
            value: state.breakMinutes,
            min: POMO_BREAK_RANGE[0],
            max: POMO_BREAK_RANGE[1],
            disabled: !idle,
            onChange: (value) => pomoConfigure({ breakMinutes: value }),
          }),
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
            primaryLabel,
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
        h(
          'div',
          { className: 'dshtodo-pomo-notice' },
          permission === 'granted'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-linkbtn',
                  onClick: testNotification,
                },
                t('pomoTest'),
              )
            : h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-linkbtn',
                  onClick: () => {
                    ensurePomodoroPermission();
                    testNotification();
                  },
                },
                t('pomoEnableNotice'),
              ),
          h('span', { className: 'dshtodo-pomo-notice-text' }, notice || (permission === 'granted' ? '' : t('pomoNoticeHint'))),
        ),
      );
    }

    // --- item form (create and edit share it) ------------------------------

    function ItemForm(props) {
      useLocaleVersion();
      const t = translate;
      const initial = props.initial || null;
      const editing = props.mode === 'edit';
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

      // Read-only detail page: the header's Edit button switches to the form.
      if (!editing) {
        return h(
          'article',
          { className: 'dshtodo-detail' },
          h('h2', { className: 'dshtodo-detail-title' }, initial.title),
          h(
            'div',
            { className: 'dshtodo-detail-meta' },
            h(
              'span',
              { className: 'dshtodo-detail-chip' + (initial.done ? ' is-done' : '') },
              initial.done ? t('sectionDone') : t('sectionOpen'),
            ),
            initial.due ? h('span', null, t('fieldDue') + ' · ' + formatDue(initial.due)) : null,
          ),
          h(
            'p',
            { className: 'dshtodo-detail-body' + (initial.detail ? '' : ' is-empty') },
            initial.detail || t('detailEmpty'),
          ),
          initial.attachment
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-detail-file',
                  title: isImageAttachment(initial.attachment)
                    ? t('previewImage')
                    : t('downloadFile'),
                  onClick: () => props.onAttachment(initial),
                },
                h(PaperclipIcon, null),
                h('span', { className: 'dshtodo-file-name' }, initial.attachment.name),
                h('span', { className: 'dshtodo-label' }, formatSize(initial.attachment.size)),
              )
            : null,
        );
      }

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
      const pomoIsRunning = pomoRunning(pomodoro);
      const pomoIsPaused = pomoPaused(pomodoro);
      const pomoIsWaiting = pomoWaiting(pomodoro);
      const pomoNext = pomodoro.phase === 'focus-end' ? 'break' : 'focus';
      // Dismissing the finished-phase banner hides it until the phase changes.
      const [bannerHidden, setBannerHidden] = React.useState(false);
      const bannerPhase = pomodoro.phase + ':' + pomodoro.completed;

      React.useEffect(() => {
        setBannerHidden(false);
      }, [bannerPhase]);

      const [formId, setFormId] = React.useState(null);
      const [editingId, setEditingId] = React.useState(null);
      /** 'view' shows the read-only detail page; only Edit switches to 'edit'. */
      const [formMode, setFormMode] = React.useState('view');
      const [preview, setPreview] = React.useState(null);
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
      const [position, setStoredPosition] = positionStore.use();
      const positionRef = React.useRef(position);
      const [dragging, setDragging] = React.useState(false);

      React.useEffect(() => {
        positionRef.current = position;
      }, [position]);

      React.useEffect(() => {
        if (!preview) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') setPreview(null);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [preview]);

      /** Every position change goes through the store, which saves the document. */
      const setPosition = (next) => {
        positionRef.current = next;
        setStoredPosition(next);
      };

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
      };

      const resetPosition = () => {
        setPosition(null);
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

      /** Images open in the viewer; anything else downloads. */
      const openAttachment = (item) => {
        const attachment = item.attachment;
        if (!attachment || !attachment.stored) return;
        try {
          const url = attachmentUrl(item.id);
          if (!url) return;
          if (isImageAttachment(attachment)) {
            setPreview({ url, name: attachment.name || '' });
            return;
          }
          const anchor = downloadRef.current;
          if (!anchor) return;
          anchor.href = url;
          anchor.download = attachment.name || 'attachment';
          anchor.click();
        } catch (error) {
          console.error('[todo-panel] attachment could not be opened', error);
        }
      };

      const openCreate = () => {
        setEditingId(null);
        setFormMode('edit');
        setFormId(nextId());
      };

      const openEdit = (item) => {
        setEditingId(item.id);
        setFormMode('view');
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
          pendingCreateIds.add(formId);
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
              title: t('openDetail'),
              'aria-label': t('openDetail') + ' ' + item.title,
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
                    ? formMode === 'view'
                      ? t('viewTitle')
                      : t('editTitle')
                    : t('newTitle')
                  : t('title'),
            ),
            h('span', { className: 'dshtodo-sub' }, formOpen || pomoOpen ? '' : summary),
            h(
              'div',
              { className: 'dshtodo-actions' },
              formOpen && formMode === 'view' && editingId
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshtodo-text-btn',
                      title: t('edit'),
                      'aria-label': t('edit'),
                      onClick: () => setFormMode('edit'),
                    },
                    t('edit'),
                  )
                : null,
              pomoOpen
                ? null
                : h(
                    'button',
                    {
                      type: 'button',
                      className:
                        'dshtodo-pomo-btn' +
                        (pomoIsRunning ? ' is-running' : '') +
                        (pomoIsWaiting ? ' is-waiting' : '') +
                        (pomoIsPaused ? ' is-paused' : ''),
                      title: pomoIsWaiting
                        ? pomoNext === 'break'
                          ? t('pomoStartBreak')
                          : t('pomoStartFocus')
                        : t('pomo'),
                      'aria-label': t('pomo'),
                      onClick: () => setPomoOpen(true),
                    },
                    pomoIsWaiting
                      ? pomoNext === 'break'
                        ? t('pomoBreak')
                        : t('pomoFocus')
                      : pomoActive
                        ? formatClock(pomoLeft)
                        : h(TimerIcon, null),
                  ),
              pomoIsRunning || pomoIsPaused
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dshtodo-icon-btn dshtodo-pomo-toggle',
                      title: pomoIsRunning ? t('pomoPause') : t('pomoResume'),
                      'aria-label': pomoIsRunning ? t('pomoPause') : t('pomoResume'),
                      onClick: () => (pomoIsRunning ? pomoPause() : pomoStart()),
                    },
                    pomoIsRunning ? h(PauseIcon, null) : h(PlayIcon, null),
                  )
                : null,
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
                mode: formMode,
                onAttachment: openAttachment,
                onCancel: closeForm,
                onSubmit: submitForm,
              })
            : h(
                React.Fragment,
                null,
                pomoIsWaiting && !bannerHidden
                  ? h(
                      'div',
                      { className: 'dshtodo-alert', role: 'status' },
                      h(
                        'div',
                        { className: 'dshtodo-alert-text' },
                        h(
                          'strong',
                          null,
                          pomoNext === 'break' ? t('pomoFocusEnded') : t('pomoBreakEnded'),
                        ),
                        h(
                          'span',
                          null,
                          pomoNext === 'break'
                            ? t('pomoBreakHint').replace('{n}', String(pomodoro.breakMinutes))
                            : t('pomoFocusHint').replace('{n}', String(pomodoro.focus)),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'dshtodo-alert-actions' },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'dshtodo-primary',
                            onClick: () => {
                              pomoStart();
                              setPomoOpen(true);
                            },
                          },
                          pomoNext === 'break' ? t('pomoStartBreak') : t('pomoStartFocus'),
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'dshtodo-secondary',
                            onClick: () => setBannerHidden(true),
                          },
                          t('pomoLater'),
                        ),
                      ),
                    )
                  : null,
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
        preview
          ? h(
              'div',
              {
                className: 'dshtodo-lightbox',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': preview.name || t('previewImage'),
                onClick: () => setPreview(null),
              },
              h('img', {
                className: 'dshtodo-lightbox-img',
                src: preview.url,
                alt: preview.name || '',
                onClick: (event) => event.stopPropagation(),
              }),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dshtodo-lightbox-close',
                  title: t('closePreview'),
                  'aria-label': t('closePreview'),
                  onClick: (event) => {
                    event.stopPropagation();
                    setPreview(null);
                  },
                },
                h(CloseIcon, { size: 14 }),
              ),
            )
          : null,
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
        // The Host owns the document; load it before anything can be edited.
        void loadState();

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
