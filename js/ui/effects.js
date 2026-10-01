/* ============================================================
   effects.js  —  屏幕特效
   ============================================================ */

/**
 * 飘字（金币 / 经验 / 伤害）
 */
function showFloatText(text, x, y, type = 'gold') {
    if (!gameState.settings.effectsEnabled) return;
    const el = document.createElement('div');
    el.className = 'fx-float-text ' + type;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1300);
}

/**
 * 升级撒花
 */
function showConfetti(count = FX_CONFETTI_COUNT) {
    if (!gameState.settings.effectsEnabled) return;
    const colors = ['#ffc107', '#f44336', '#2196f3', '#4caf50', '#9c27b0'];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'fx-confetti';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (1.5 + Math.random() * 2) + 's';
        el.style.animationDelay = (Math.random() * 0.5) + 's';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }
}

/**
 * 屏幕震动
 */
function shakeScreen() {
    if (!gameState.settings.effectsEnabled) return;
    document.body.classList.add('fx-shake');
    setTimeout(() => document.body.classList.remove('fx-shake'), 400);
}

/**
 * 成就横幅
 */
function showAchievementBanner(ach) {
    if (!gameState.settings.effectsEnabled) return;
    const el = document.createElement('div');
    el.className = 'fx-achievement-banner';
    el.innerHTML = `
        <div class="fx-ach-icon">${ach.icon}</div>
        <div>
            <div class="fx-ach-title">🏆 成就达成</div>
            <div class="fx-ach-name">${ach.name}</div>
        </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 600);
    }, 3000);
}

function initEffects() {
    /* 成就解锁 → 显示横幅 */
    eventBus.on(EVENTS.ACHIEVEMENT_UNLOCKED, (ach) => showAchievementBanner(ach));
    /* 升级 → 撒花 */
    eventBus.on(EVENTS.LEVEL_UP, () => showConfetti());
}