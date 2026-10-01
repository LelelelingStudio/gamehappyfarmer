/* ============================================================
   tradeUI.js  —  低价甩卖弹窗 / 二手市场弹窗 / 其他商城内容
   ============================================================ */

/* ============================================================
   低价甩卖
   ============================================================ */
let _quickSellItems = [];
let _quickSellPicked = {};

function openQuickSell() {
    const dlg = document.getElementById('quick-sell-dialog');
    if (!dlg) return;
    dlg.classList.add('show');
    _quickSellItems = getQuickSellList();
    _quickSellPicked = {};
    const hint = document.getElementById('quick-sell-hint');
    if (hint) hint.textContent = t('trade.quickSellHint');
    renderQuickSell();
}

function renderQuickSell() {
    const box = document.getElementById('quick-sell-list');
    if (!box) return;

    if (_quickSellItems.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('trade.noSellable') + '</div>';
        updateQuickSellTotal();
        return;
    }

    box.innerHTML = _quickSellItems.map((it, i) => {
        const picked = !!_quickSellPicked[i];
        const pct = Math.round(it.ratio * 100);
        return `
            <div class="quick-sell-item ${picked ? 'picked' : ''}" data-idx="${i}">
                <div class="quick-sell-item-main">
                    <div class="quick-sell-item-name">${it.icon} ${it.name} ×${it.count}</div>
                    <div class="quick-sell-item-meta">${t('trade.quickSellPrice', { unit: formatNumber(it.unit), pct })}</div>
                </div>
                <div class="quick-sell-item-total">${formatNumber(it.total)} 💰</div>
            </div>
        `;
    }).join('');

    box.querySelectorAll('.quick-sell-item').forEach((el) => {
        el.onclick = () => {
            const i = Number(el.dataset.idx);
            _quickSellPicked[i] = !_quickSellPicked[i];
            renderQuickSell();
        };
    });

    updateQuickSellTotal();
}

function updateQuickSellTotal() {
    const el = document.getElementById('quick-sell-total');
    if (!el) return;
    let total = 0;
    for (const k of Object.keys(_quickSellPicked)) {
        if (_quickSellPicked[k]) total += _quickSellItems[Number(k)].total;
    }
    el.textContent = formatNumber(total);
}

function confirmQuickSell() {
    const list = [];
    for (const k of Object.keys(_quickSellPicked)) {
        if (_quickSellPicked[k]) {
            const it = _quickSellItems[Number(k)];
            list.push({ name: it.name, count: it.count });
        }
    }
    if (list.length === 0) { showNotification(t('ui.quickSell'), t('trade.errNoSelection'), 'warning'); return; }

    const r = quickSell(list);
    if (!r.ok) { showAlert(t('ui.quickSell'), r.reason || ''); return; }
    showNotification(t('ui.quickSell'), t('trade.quickSellDone', { gold: formatNumber(r.gold) }), 'success');
    addLog(t('trade.quickSellLog', { gold: formatNumber(r.gold), count: r.items }), 'success');
    renderGame();
    openQuickSell();   /* 刷新清单 */
}

/* ============================================================
   二手市场
   ============================================================ */
function openSecondHand() {
    const dlg = document.getElementById('secondhand-dialog');
    if (!dlg) return;
    dlg.classList.add('show');
    renderSecondHand();
}

function renderSecondHand() {
    const box = document.getElementById('second-hand-list');
    if (!box) return;
    const stock = getSecondHandStock();

    if (stock.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('trade.noSecondHand') + '</div>';
        return;
    }

    box.innerHTML = stock.map((it, i) => `
        <div class="second-hand-item" data-idx="${i}">
            <div class="second-hand-main">
                <div class="second-hand-name">${it.display}</div>
                <div class="second-hand-note">${it.note}</div>
            </div>
            <div class="second-hand-side">
                <div class="second-hand-price">${formatNumber(it.price)} 💰</div>
                <button class="btn btn-small btn-primary" data-buy="${i}" ${gameState.gold < it.price ? 'disabled' : ''}>${t('ui.buy')}</button>
            </div>
        </div>
    `).join('');

    box.querySelectorAll('button[data-buy]').forEach((btn) => {
        btn.onclick = () => {
            const it = getSecondHandStock()[Number(btn.dataset.buy)];
            const r = buySecondHand(it);
            if (!r.ok) { showNotification(t('ui.buy'), r.reason || t('trade.errGold'), 'warning'); return; }
            showNotification(t('ui.buySeedSuccess'), it.display, 'success');
            renderSecondHand();
            renderGame();
        };
    });
}

/* ============================================================
   其他商城（辅助用品 + 限时种子 + 二手市场入口）
   ============================================================ */
function renderMallOther() {
    const box = document.getElementById('mall-items');
    if (!box) return;

    const goods = getSupportGoods();
    const seeds = getLimitedSeeds();

    let html = `
        <div class="mall-other-header">
            <button class="btn btn-small btn-primary" id="open-secondhand-btn">♻️ ${t('ui.secondHandEntry')}</button>
        </div>
    `;

    if (goods.length > 0) {
        html += `<div class="mall-other-title">${t('trade.sectionSupport')}</div>`;
        html += goods.map((g) => {
            const can = gameState.gold >= g.price;
            return `
                <div class="mall-item">
                    <div class="mall-item-main">
                        <div class="mall-item-name">${g.display} <span class="mall-item-tag">${t('trade.tagSupport')}</span></div>
                        <div class="mall-item-desc">${g.desc || ''}</div>
                    </div>
                    <div class="mall-item-side">
                        <div class="mall-item-price">${formatNumber(g.price)} 💰</div>
                        <button class="btn btn-small ${can ? 'btn-primary' : ''}" data-support="${g.key}" ${can ? '' : 'disabled'}>${t('ui.buy')}</button>
                    </div>
                </div>`;
        }).join('');
    }

    html += `<div class="mall-other-title">${t('trade.sectionLimitedSeeds')}</div>`;
    if (seeds.length === 0) {
        html += `<div class="empty-state">${t('trade.noLimitedSeeds')}</div>`;
    } else {
        html += seeds.map((s) => {
            const can = gameState.gold >= s.price;
            return `
                <div class="mall-item">
                    <div class="mall-item-main">
                        <div class="mall-item-name">${s.display} <span class="mall-item-tag">${t('trade.tagLimited')}</span></div>
                        <div class="mall-item-desc">${t('trade.limitedSeedDesc', { level: s.unlockLevel })}</div>
                    </div>
                    <div class="mall-item-side">
                        <div class="mall-item-price">${formatNumber(s.price)} 💰</div>
                        <button class="btn btn-small ${can ? 'btn-primary' : ''}" data-limited="${s.cropId}" ${can ? '' : 'disabled'}>${t('ui.buy')}</button>
                    </div>
                </div>`;
        }).join('');
    }

    box.innerHTML = html;

    const shBtn = document.getElementById('open-secondhand-btn');
    if (shBtn) shBtn.onclick = () => openSecondHand();

    box.querySelectorAll('button[data-support]').forEach((btn) => {
        btn.onclick = () => {
            const good = getSupportGoods().find((g) => g.key === btn.dataset.support);
            const r = buySupportGood(good);
            if (!r.ok) { showNotification(t('ui.buy'), r.reason || t('trade.errGold'), 'warning'); return; }
            showNotification(t('ui.buySeedSuccess'), good.display, 'success');
            renderMallOther();
            renderGame();
        };
    });

    box.querySelectorAll('button[data-limited]').forEach((btn) => {
        btn.onclick = () => {
            const seed = getLimitedSeeds().find((s) => String(s.cropId) === String(btn.dataset.limited));
            const r = buySupportGood(seed);
            if (!r.ok) { showNotification(t('ui.buy'), r.reason || t('trade.errGold'), 'warning'); return; }
            showNotification(t('ui.buySeedSuccess'), seed.display, 'success');
            renderMallOther();
            renderGame();
        };
    });
}

/* ============================================================
   施肥（顶部按钮）
   ============================================================ */
function openFertilizeAllMenu() {
    if (typeof FERTILIZERS === 'undefined') {
        showAlert(t('farm.fertilizerUnavailableTitle'), t('farm.fertilizerUnavailableBody'));
        return;
    }
    const available = FERTILIZERS.filter((f) => gameState.level >= (f.unlockLevel || 1) && getStorageCount(f.name) > 0);
    if (available.length === 0) {
        showAlert(t('farm.noFertilizerTitle'), t('farm.noFertilizerBody') + '\n\n' + t('trade.buyFertilizerHint'));
        return;
    }
    const buttons = available.map((f) => ({
        text: `${f.icon} ${f.name}${t('farm.fertilizerStock', { count: getStorageCount(f.name) })}`,
        value: f.id,
    }));
    buttons.push({ text: t('common.cancel'), value: null });

    showModal(t('farm.chooseFertilizer'), t('trade.fertilizeAllHint'), buttons).then((v) => {
        if (v === null || v === undefined) return;
        const f = getFertilizerById(v);
        if (!f) return;
        let count = 0;
        for (let i = 0; i < gameState.ownedPlots; i++) {
            const p = getPlot(i);
            if (p.state !== 'planted') continue;
            const r = fertilizePlot(i, f);
            if (r && r.ok) count++;
        }
        if (count === 0) { showAlert(t('farm.chooseFertilizer'), t('trade.noFertilizeTarget')); return; }
        showNotification(t('farm.fertilizeSuccess'), t('trade.fertilizeAllDone', { count }), 'success');
        renderGame();
    });
}

/* -------- 初始化 -------- */
function initTradeUI() {
    const quickBtn = document.getElementById('quick-sell-btn');
    if (quickBtn) quickBtn.onclick = () => openQuickSell();
    const confirmBtn = document.getElementById('quick-sell-confirm');
    if (confirmBtn) confirmBtn.onclick = () => confirmQuickSell();
    const fertBtn = document.getElementById('fertilize-all-btn');
    if (fertBtn) fertBtn.onclick = () => openFertilizeAllMenu();
}
