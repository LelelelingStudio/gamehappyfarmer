/* ============================================================
   skinSystem.js  —  皮肤系统
   版本：v1.0.1
   ============================================================ */

/* -------- 初始化 -------- */
function initSkin() {
    if (!gameState.unlockedSkins) gameState.unlockedSkins = ['default'];
    if (!gameState.currentSkin) gameState.currentSkin = 'default';
    applySkin(gameState.currentSkin, false);
}

/* -------- 按等级检查新解锁 -------- */
function checkSkinUnlock() {
    const unlocked = SKINS.filter(s => gameState.level >= s.levelRequired);
    let newlyUnlocked = [];

    for (const s of unlocked) {
        if (!gameState.unlockedSkins.includes(s.id)) {
            gameState.unlockedSkins.push(s.id);
            newlyUnlocked.push(s);
        }
    }

    if (newlyUnlocked.length > 0) {
        markDirty();
        for (const s of newlyUnlocked) {
            eventBus.emit(EVENTS.SKIN_UNLOCKED, { skinId: s.id });
            if (typeof showNotification === 'function') {
                showNotification(t('skin.unlockedTitle'), `${s.icon} ${s.name}`, 'success');
            }
        }
    }
    return newlyUnlocked;
}

/* -------- 应用皮肤（写入 CSS 变量） -------- */
function applySkin(skinId, animate = true) {
    const skin = getSkinById(skinId);
    if (!skin) return false;

    const root = document.documentElement;

    if (animate) {
        root.classList.add('skin-transition');
    }

    for (const key in skin.cssVars) {
        root.style.setProperty(key, skin.cssVars[key]);
    }

    gameState.currentSkin = skinId;
    markDirty();

    if (animate) {
        setTimeout(() => root.classList.remove('skin-transition'), 600);
    }

    eventBus.emit(EVENTS.SKIN_CHANGED, { skinId });
    return true;
}

/* -------- 选择皮肤 -------- */
function selectSkin(skinId) {
    const skin = getSkinById(skinId);
    if (!skin) {
        return { ok: false, reason: t('skin.notFound') };
    }
    if (!gameState.unlockedSkins.includes(skinId)) {
        return { ok: false, reason: t('skin.levelRequired', { level: skin.levelRequired }) };
    }
    applySkin(skinId, true);
    if (typeof playSfx === 'function') playSfx('click');
    return { ok: true };
}

/* -------- 获取当前皮肤 -------- */
function getCurrentSkin() {
    return getSkinById(gameState.currentSkin);
}