/* ============================================================
   skinUI.js  —  皮肤选择
   ============================================================ */

function openSkinSelector() {
    const dlg = document.getElementById('skin-dialog');
    if (dlg) dlg.classList.add('show');
    renderSkinSelector();
}

function closeSkinSelector() {
    const dlg = document.getElementById('skin-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderSkinSelector() {
    const box = document.getElementById('skin-selector');
    if (!box) return;

    box.innerHTML = SKINS.map(s => {
        const unlocked = gameState.unlockedSkins.includes(s.id);
        const isCurrent = gameState.currentSkin === s.id;
        return `
            <div class="skin-item ${isCurrent ? 'active' : ''} ${unlocked ? '' : 'locked'}" data-sid="${s.id}">
                <div class="skin-item-main">
                    <div class="skin-item-name">${s.icon} ${s.name}</div>
                    <div class="skin-item-desc">${s.description}</div>
                    <div class="skin-item-level">${t('skin.levelRequired', { level: s.levelRequired })}</div>
                </div>
                <div class="skin-item-state">${isCurrent ? '✓ ' + t('skin.inUse') : (unlocked ? t('skin.clickUse') : '🔒 ' + t('skin.locked'))}</div>
            </div>
        `;
    }).join('');

    box.querySelectorAll('.skin-item').forEach(el => {
        el.onclick = () => {
            const r = selectSkin(el.dataset.sid);
            if (!r.ok) { showNotification(t('skin.cannotSwitch'), r.reason, 'warning'); return; }
            /* 记录已使用过的皮肤 */
            if (gameState.stats && gameState.stats.skinUsed) {
                gameState.stats.skinUsed[el.dataset.sid] = true;
            }
            showNotification(t('skin.switched'), '', 'success');
            renderSkinSelector();
            if (typeof checkAchievements === 'function') checkAchievements();
        };
    });
}

function initSkinUI() {
    const closeBtn = document.querySelector('#skin-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeSkinSelector;
}
