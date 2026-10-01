/* ============================================================
   achievementUI.js  —  成就展览馆
   ============================================================ */

let _achTab = 'all';

function openAchievements() {
    const dlg = document.getElementById('achievement-dialog');
    if (dlg) dlg.classList.add('show');
    renderAchievements();
}

function closeAchievements() {
    const dlg = document.getElementById('achievement-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderAchievements() {
    const prog = getAchievementProgress();
    const uEl = document.getElementById('ach-unlocked');
    const tEl = document.getElementById('ach-total');
    if (uEl) uEl.textContent = prog.unlocked;
    if (tEl) tEl.textContent = prog.total;

    /* 标签文案（语言切换后需要重新套用） */
    document.querySelectorAll('.ach-tab').forEach(tab => {
        const label = t('ui.achievementTabs.' + tab.dataset.tab);
        if (label) tab.textContent = label;
        tab.classList.toggle('active', tab.dataset.tab === _achTab);
        tab.onclick = () => { _achTab = tab.dataset.tab; renderAchievements(); };
    });

    const box = document.getElementById('achievement-list');
    if (!box) return;

    const list = getAchievementsByTab(_achTab);
    if (list.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noAchievement') + '</div>';
        return;
    }

    box.innerHTML = list.map(a => {
        const unlocked = isAchievementUnlocked(a.id);
        const hidden = a.hidden && !unlocked;
        return `
            <div class="achievement-item ${unlocked ? 'done' : 'locked'}">
                <div class="achievement-icon">${unlocked ? a.icon : '❓'}</div>
                <div class="achievement-body">
                    <div class="achievement-name">${hidden ? t('ui.hiddenAchievementName') : a.name}</div>
                    <div class="achievement-desc">${hidden ? t('ui.hiddenAchievement') : a.description}</div>
                </div>
                <div class="achievement-state">${unlocked ? '✓ ' + t('ui.achievementUnlocked') : ''}</div>
            </div>
        `;
    }).join('');
}

function initAchievementUI() {
    const closeBtn = document.querySelector('#achievement-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeAchievements;
}
