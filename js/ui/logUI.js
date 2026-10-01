/* ============================================================
   logUI.js  —  事件日志
   版本：v1.0.1
   ============================================================ */

/**
 * 往日志里追加一条
 * @param {string} message
 * @param {string} type  ''|'success'|'warning'|'danger'|'event'
 */
function addLog(message, type = '') {
    const log = document.getElementById('log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry' + (type ? ' ' + type : '');
    entry.textContent = `[${t('common.days', { days: gameState.day })}] ${message}`;
    log.appendChild(entry);

    /* 上限 200 条 */
    while (log.children.length > 200) {
        log.removeChild(log.firstChild);
    }

    log.scrollTop = log.scrollHeight;
    eventBus.emit(EVENTS.LOG_ADDED, { message, type });
}

function clearLog() {
    const log = document.getElementById('log');
    if (!log) return;
    log.innerHTML = '';
    addLog(t('notifications.logCleared'));
}

function renderEventFrequency() {
    const el = document.getElementById('event-rate');
    const freq = (typeof gameState.eventFrequency === 'number') ? gameState.eventFrequency : EVENT_FREQUENCY_DEFAULT;
    if (el) el.textContent = freq.toFixed(1) + 'x';
}

function initLogUI() {
    const clearBtn = document.getElementById('clear-log-btn');
    if (clearBtn) clearBtn.onclick = clearLog;

    /* 订阅系统事件 → 自动写日志 */
    eventBus.on(EVENTS.CROP_HARVESTED, (d) => {
        addLog(t('log.harvest', { name: d.name }), 'success');
    });
    eventBus.on(EVENTS.LEVEL_UP, (lvl) => {
        addLog(t('log.levelUp', { level: lvl }), 'success');
    });
    eventBus.on(EVENTS.MERCHANT_ARRIVED, () => {
        addLog(t('log.merchantArrived'), 'event');
    });
    eventBus.on(EVENTS.SEASON_CHANGED, (s) => {
        addLog(t('log.seasonChanged', { season: s }), 'event');
    });
    eventBus.on(EVENTS.WEATHER_CHANGED, (d) => {
        addLog(t('log.weatherChanged', { weather: d.weather }), 'event');
    });
    eventBus.on(EVENTS.RANDOM_EVENT, (events) => {
        if (!events || !events.length) return;
        for (const e of events) {
            addLog(`${e.icon || ''} ${e.message || e.name}`, e.type || 'event');
        }
    });

    renderEventFrequency();
}