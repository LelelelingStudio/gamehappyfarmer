/* ============================================================
   ticker.js  —  右上角滚动播报
   ============================================================ */

let _tickerContainer = null;

function initTicker() {
    if (_tickerContainer) return;
    _tickerContainer = document.getElementById('ticker-container');
    if (!_tickerContainer) {
        _tickerContainer = document.createElement('div');
        _tickerContainer.id = 'ticker-container';
        document.body.appendChild(_tickerContainer);
    }
    applyTickerPosition();

    /* 订阅事件自动播报 */
    eventBus.on(EVENTS.CROP_HARVESTED, (d) => pushTicker(t('ticker.harvest', { name: d.name }), 't-success', '🧺'));
    eventBus.on(EVENTS.LEVEL_UP, (lv) => pushTicker(t('ticker.levelUp', { level: lv }), 't-success', '⭐'));
    eventBus.on(EVENTS.MERCHANT_ARRIVED, () => pushTicker(t('ticker.merchantArrived'), 't-event', '👔'));
    eventBus.on(EVENTS.FACTORY_DONE, (d) => pushTicker(t('ticker.factoryDone', { count: d.completed }), 't-info', '🏭'));
    eventBus.on(EVENTS.SEASON_CHANGED, (s) => pushTicker(t('ticker.seasonChanged', { season: s }), 't-event', '🍂'));
    eventBus.on(EVENTS.WEATHER_CHANGED, (d) => pushTicker(t('ticker.weatherChanged', { weather: d.weather }), 't-info', '☁️'));
}

function applyTickerPosition() {
    const pos = gameState.settings.tickerPosition || 'top-right';
    ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'].forEach(p => {
        document.documentElement.classList.remove('ticker-' + p);
    });
    document.documentElement.classList.add('ticker-' + pos);
}

/**
 * 推一条滚动消息
 */
function pushTicker(text, type = 't-info', icon = '📢') {
    if (!_tickerContainer) initTicker();
    const el = document.createElement('div');
    el.className = 'ticker-item ' + type;
    el.innerHTML = `
        <div class="ticker-icon">${icon}</div>
        <div class="ticker-content"><div class="ticker-text">${text}</div></div>
        <button class="ticker-close">&times;</button>
    `;
    const close = () => {
        el.classList.remove('show');
        el.classList.add('hide');
        setTimeout(() => el.remove(), 300);
    };
    el.querySelector('.ticker-close').onclick = close;
    _tickerContainer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(close, 5000);
}