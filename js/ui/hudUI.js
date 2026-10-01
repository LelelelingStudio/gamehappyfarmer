/* ============================================================
   hudUI.js  —  顶部状态栏 + 计时器
   版本：v1.0.1
   ============================================================ */

let _hudTimerInterval = null;

function renderHud() {
    /* 金币（用货币系统的格式化） */
    const goldEl = document.getElementById('gold');
    if (goldEl) {
        if (typeof formatCurrencyTotal === 'function') {
            goldEl.textContent = formatCurrencyTotal(gameState.gold);
        } else {
            goldEl.textContent = formatNumber(gameState.gold);
        }
        /* 悬停显示完整的分级明细（multi 模式下数字是换算过的） */
        if (typeof breakdownCopper === 'function' && typeof formatBreakdown === 'function') {
            goldEl.title = t('ui.goldLabel') + ' ' + formatBreakdown(breakdownCopper(gameState.gold), { compact: false });
        }
    }

    /* 等级 */
    const levelEl = document.getElementById('level');
    if (levelEl) levelEl.textContent = gameState.level;

    /* 经验 */
    const expEl = document.getElementById('exp');
    if (expEl) {
        expEl.textContent = `${Math.floor(gameState.exp)}/${gameState.expToNextLevel}`;
    }

    /* 天数 */
    const dayEl = document.getElementById('day');
    if (dayEl) dayEl.textContent = gameState.day;

    /* 仓库 */
    if (typeof updateStorageUsage === 'function') updateStorageUsage();
    const storageEl = document.getElementById('storage-stat');
    if (storageEl) {
        storageEl.textContent = `${gameState.storageUsed}/${gameState.storageCapacity}`;
    }

    /* 季节 */
    const seasonEl = document.getElementById('season');
    if (seasonEl) {
        const seasonMap = {
            '春季': t('weather.seasons.spring'),
            '夏季': t('weather.seasons.summer'),
            '秋季': t('weather.seasons.autumn'),
            '冬季': t('weather.seasons.winter')
        };
        seasonEl.textContent = seasonMap[gameState.season] || gameState.season;
    }

    /* 天气 */
    const weatherEl = document.getElementById('weather');
    if (weatherEl) {
        const weatherMap = {
            '晴朗': t('weather.conditions.sunny'),
            '多云': t('weather.conditions.cloudy'),
            '小雨': t('weather.conditions.lightRain'),
            '大雨': t('weather.conditions.heavyRain'),
            '暴风雨': t('weather.conditions.storm')
        };
        weatherEl.textContent = weatherMap[gameState.weather] || gameState.weather;
    }

    /* 商人倒计时 */
    const merchantEl = document.getElementById('merchant-countdown');
    if (merchantEl) {
        if (gameState.merchant.present) {
            merchantEl.textContent = t('hud.inScene', { days: gameState.merchant.daysRemaining });
        } else {
            merchantEl.textContent = gameState.merchant.nextVisit;
        }
    }
}

/* -------- 计时器 UI -------- */
function updateTimerUI() {
    const progressEl = document.getElementById('timer-progress');
    const textEl = document.getElementById('timer-text');
    if (!progressEl || !textEl) return;

    const readyAt = gameState.nextDayReadyAt || 0;
    const now = Date.now();

    if (!readyAt || now >= readyAt) {
        progressEl.style.width = '100%';
        textEl.textContent = t('hud.ready');

        if (typeof notify !== 'undefined' && gameState.settings && gameState.settings.browserNotify && Notification.permission === 'granted' && document.visibilityState !== 'visible' && !gameState._nextDayReadyNotified) {
            notify.nextDayReady();
            gameState._nextDayReadyNotified = true;
        }
        return;
    }

    if (gameState._nextDayReadyNotified) {
        gameState._nextDayReadyNotified = false;
    }

    const total = NEXT_DAY_COOLDOWN_SEC * 1000;
    const left = readyAt - now;
    const percent = Math.max(0, Math.min(100, (1 - left / total) * 100));
    progressEl.style.width = percent.toFixed(1) + '%';
    textEl.textContent = t('hud.seconds', { seconds: Math.ceil(left / 1000) });
}

function startHudTimer() {
    if (_hudTimerInterval) return;
    _hudTimerInterval = setInterval(updateTimerUI, 500);
    updateTimerUI();
}

function stopHudTimer() {
    if (_hudTimerInterval) {
        clearInterval(_hudTimerInterval);
        _hudTimerInterval = null;
    }
}
/* -------- 顶栏声音开关 -------- */
function renderSoundToggle() {
    const icon = document.getElementById('sound-icon');
    if (!icon) return;
    const on = (typeof audio !== 'undefined' && audio.isSoundOn) ? audio.isSoundOn() : true;
    icon.textContent = on ? '🔊' : '🔇';
    const btn = document.getElementById('sound-btn');
    if (btn) btn.classList.toggle('muted', !on);
}

function initSoundToggle() {
    const btn = document.getElementById('sound-btn');
    if (!btn) return;
    btn.onclick = () => {
        if (typeof audio === 'undefined' || !audio.toggleSound) return;
        const on = audio.toggleSound();
        renderSoundToggle();
        showNotification(t('ui.soundToggle'), on ? t('ui.soundOn') : t('ui.soundOff'), 'info');
    };
    renderSoundToggle();
}
