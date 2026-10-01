/* ============================================================
   mallUI.js  —  商城（100 种道具）
   道具效果本身由 itemEffectSystem.js 实现。
   ============================================================ */

let _mallCategory = 'low';

function openMall() {
    const dlg = document.getElementById('mall-dialog');
    if (dlg) dlg.classList.add('show');
    renderMall();
}

function closeMall() {
    const dlg = document.getElementById('mall-dialog');
    if (dlg) dlg.classList.remove('show');
}

/* 按等级解锁的道具 ID */
function getUnlockedMallIds() {
    const lv = gameState.level;
    const ids = new Set();
    for (let i = 1; i <= 15; i++) ids.add(i);
    if (lv >= 10) for (let i = 16; i <= 50; i++) ids.add(i);
    if (lv >= 50) {
        const extra = Math.floor((lv - 50) / 5) * 5;
        for (let i = 51; i <= Math.min(100, 50 + extra); i++) ids.add(i);
    }
    return ids;
}

/* tab key → i18n key（复用已有的 mallTabs 文案） */
const MALL_TAB_LABEL_KEYS = {
    low: 'ui.mallTabs.low',
    normal: 'ui.mallTabs.normal',
    mid: 'ui.mallTabs.mid',
    high: 'ui.mallTabs.high',
    other: 'ui.mallTabs.other',
};

function renderMall() {
    /* 标签文案（语言切换后需要重新套用） */
    document.querySelectorAll('.mall-tab').forEach(tab => {
        const key = MALL_TAB_LABEL_KEYS[tab.dataset.cat];
        if (key) tab.textContent = t(key);
        tab.classList.toggle('active', tab.dataset.cat === _mallCategory);
        tab.onclick = () => {
            _mallCategory = tab.dataset.cat;
            renderMall();
        };
    });

    const box = document.getElementById('mall-items');
    if (!box) return;

    /* 「其他」分类：辅助用品 + 限时种子 + 二手市场入口 */
    if (_mallCategory === 'other') {
        if (typeof renderMallOther === 'function') renderMallOther();
        return;
    }

    const range = MALL_CATEGORY_RANGES[_mallCategory] || [1, 15];
    const unlocked = getUnlockedMallIds();

    const items = MALL_ITEMS.filter(it => it.id >= range[0] && it.id <= range[1]);
    if (items.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noMall') + '</div>';
        return;
    }

    box.innerHTML = items.map(it => {
        const isUnlocked = unlocked.has(it.id);
        const price = (typeof getMallEffectivePrice === 'function') ? getMallEffectivePrice(it) : it.price;
        const canAfford = gameState.gold >= price;
        const discounted = price < it.price;
        const duration = it.duration
            ? `<div class="mall-item-duration">${t('ui.mallDuration', { days: it.duration })}</div>`
            : '';
        return `
            <div class="mall-item ${isUnlocked ? '' : 'locked'}">
                <div class="mall-item-main">
                    <div class="mall-item-name">${it.icon} ${it.name}
                        <span class="mall-item-tag">${it.type === 'consumable' ? t('ui.mallTypeConsumable') : (it.type === 'timed' ? t('ui.mallTypeTimed') : t('ui.mallTypePermanent'))}</span>
                    </div>
                    <div class="mall-item-desc">${it.description || ''}</div>
                    ${duration}
                </div>
                <div class="mall-item-side">
                    <div class="mall-item-price">${formatNumber(price)} 💰${discounted ? ' <s style="color:#999;font-size:0.8em">' + formatNumber(it.price) + '</s>' : ''}</div>
                    <button class="btn btn-small ${isUnlocked && canAfford ? 'btn-primary' : ''}" data-id="${it.id}" ${isUnlocked && canAfford ? '' : 'disabled'}>${isUnlocked ? t('ui.buy') : t('ui.lock')}</button>
                </div>
            </div>
        `;
    }).join('');

    box.querySelectorAll('button[data-id]').forEach(btn => {
        btn.onclick = () => {
            buyMallItem(Number(btn.dataset.id));
        };
    });
}

function buyMallItem(id) {
    const it = MALL_ITEMS.find(x => x.id === id);
    if (!it) return;

    /* 等级未解锁 */
    if (!getUnlockedMallIds().has(id)) {
        showNotification(t('ui.buy'), t('ui.mallLocked'), 'warning');
        return;
    }

    const price = (typeof getMallEffectivePrice === 'function') ? getMallEffectivePrice(it) : it.price;
    if (gameState.gold < price) {
        showNotification(t('ui.goldNotEnough'), t('ui.needGold', { price: formatNumber(price) }), 'warning');
        return;
    }
    spendGold(price);

    /* 交给效果系统处理（金币/经验/永久增益/限时增益/消耗品/即时操作） */
    const r = (typeof applyMallItemEffect === 'function')
        ? applyMallItemEffect(it)
        : { ok: true };

    if (r && r.ok) {
        const msg = r.key ? t(r.key, r.params || {}) : it.name;
        showNotification(t('ui.buySeedSuccess'), msg || it.name, 'success');
        addLog(t('ui.buyPrompt', { name: it.name }), 'success');
    } else {
        /* 效果没有产生变化（例如没有正在生长的作物）时退回金币，避免玩家白花钱 */
        addGold(price);
        const msg = (r && r.key) ? t(r.key) : t('mall.fxUnknown');
        showNotification(t('ui.buy'), msg, 'warning');
    }

    renderGame();
    renderMall();
}

function initMallUI() {
    const closeBtn = document.querySelector('#mall-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeMall;
}
