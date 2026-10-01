/* ============================================================
   merchantUI.js  —  商人板块（5 位商人 + 呼叫）+ 交易弹窗
   ============================================================ */

/* -------- 商人板块 -------- */

function openMerchantHub() {
    const dlg = document.getElementById('merchant-hub-dialog');
    if (!dlg) return;
    dlg.classList.add('show');
    renderMerchantHub();
}

function closeMerchantHub() {
    const dlg = document.getElementById('merchant-hub-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderMerchantHub() {
    const list = document.getElementById('merchant-hub-list');
    const cd = document.getElementById('merchant-hub-countdown');
    if (!list) return;

    const m = gameState.merchant;
    if (cd) {
        cd.textContent = m.present
            ? t('trade.merchantHere', { days: m.daysRemaining })
            : t('trade.merchantNext', { days: Math.max(0, m.nextVisit) });
    }

    const cost = getMerchantCallCost();

    list.innerHTML = MERCHANTS.map((mc) => {
        const isHere = m.present && m.currentMerchantId === mc.id;
        return `
            <div class="merchant-card ${isHere ? 'here' : ''}" data-id="${mc.id}">
                <div class="merchant-card-avatar">${mc.avatar || '🧑‍💼'}</div>
                <div class="merchant-card-body">
                    <div class="merchant-card-name">${mc.name}${isHere ? ' · ' + t('trade.merchantInTown') : ''}</div>
                    <div class="merchant-card-tagline">${mc.tagline || ''}</div>
                    <div class="merchant-card-desc">${mc.description || ''}</div>
                    <div class="merchant-card-rules">${describeMerchantRules(mc)}</div>
                </div>
                <div class="merchant-card-actions">
                    ${isHere
                        ? `<button class="btn btn-small btn-primary" data-trade="${mc.id}">${t('trade.goTrade')}</button>`
                        : `<button class="btn btn-small" data-call="${mc.id}" ${gameState.gold < cost ? 'disabled' : ''}>${t('trade.callMerchant')} · ${formatNumber(cost)} 💰</button>`}
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('button[data-trade]').forEach((btn) => {
        btn.onclick = () => {
            closeMerchantHub();
            openMerchant();
        };
    });
    list.querySelectorAll('button[data-call]').forEach((btn) => {
        btn.onclick = () => {
            const r = callMerchant(btn.dataset.call);
            if (!r.ok) { showNotification(t('trade.callMerchant'), r.reason || '', 'warning'); return; }
            showNotification(t('trade.callMerchant'), t('trade.callSuccess', { name: r.name, days: r.days }), 'success');
            addLog(t('trade.callLog', { name: r.name, cost: formatNumber(r.cost) }), 'success');
            renderMerchantHub();
            renderGame();
        };
    });
}

/* 用规则数据生成一句人话说明 */
function describeMerchantRules(mc) {
    const rules = mc.priceRules || {};
    const parts = [];
    parts.push(t('trade.ruleBase', { pct: Math.round((rules.default || 1) * 100) }));
    if (rules.categoryBonus) {
        const best = Object.entries(rules.categoryBonus).sort((a, b) => b[1] - a[1])[0];
        if (best) parts.push(t('trade.ruleCategory', { cat: getCropCategoryName(best[0]) || best[0], pct: Math.round(best[1] * 100) }));
    }
    if (rules.bulkThreshold) parts.push(t('trade.ruleBulk', { n: rules.bulkThreshold, pct: Math.round((rules.bulkMultiplier || 1) * 100) }));
    const min = (mc.acceptsRules && mc.acceptsRules.minItemLevel) || 0;
    parts.push(min > 0 ? t('trade.ruleMinLevel', { level: min }) : t('trade.ruleAll'));
    return parts.join(' · ');
}

/* -------- 交易弹窗（左：商人资料 / 右：售卖中心） -------- */

function openMerchant() {
    if (!gameState.merchant.present) {
        showAlert(t('merchant.absent'), t('merchant.absentReason') + '\n\n' + t('trade.useHubHint'));
        return;
    }
    const dlg = document.getElementById('merchant-dialog');
    if (dlg) dlg.classList.add('show');
    renderMerchant();
}

function closeMerchant() {
    const dlg = document.getElementById('merchant-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderMerchant() {
    const m = gameState.merchant;
    const merchant = getMerchantById(m.currentMerchantId);
    if (!merchant) return;

    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('merchant-name', merchant.name);
    setTxt('merchant-tagline', merchant.tagline || '');
    setTxt('merchant-description', merchant.greeting || merchant.description || '');
    setTxt('merchant-leave-time', t('merchant.leave', { days: m.daysRemaining }));

    const avatarEl = document.getElementById('merchant-avatar');
    if (avatarEl) avatarEl.textContent = merchant.avatar || '🧑‍💼';

    const items = getMerchantSellableItems();
    const box = document.getElementById('merchant-items');
    if (!box) return;

    if (items.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('merchant.noItems') + '</div>';
        setTxt('merchant-total-value', '0');
        return;
    }

    box.innerHTML = items.map((it, i) => `
        <div class="merchant-item" data-idx="${i}">
            <div class="merchant-item-info">
                <input type="checkbox" class="merchant-item-checkbox" data-idx="${i}">
                <div class="merchant-item-details">
                    <div class="merchant-item-name">${it.icon} ${it.name}</div>
                    <div>${t('merchant.stock', { count: formatNumber(it.count) })} · ${t('merchant.price', { price: formatNumber(it.unitPrice) })}</div>
                </div>
            </div>
            <div class="merchant-item-price">${formatNumber(it.totalPrice)}</div>
        </div>
    `).join('');

    const selected = new Set();
    const updateTotal = () => {
        let total = 0;
        selected.forEach((i) => { total += items[i].totalPrice; });
        setTxt('merchant-total-value', formatNumber(total));
    };
    box.querySelectorAll('.merchant-item').forEach((el) => {
        el.onclick = (e) => {
            if (e.target.tagName === 'INPUT') return;
            const cb = el.querySelector('input');
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event('change'));
        };
    });
    box.querySelectorAll('input[type=checkbox]').forEach((cb) => {
        cb.onchange = () => {
            const i = Number(cb.dataset.idx);
            if (cb.checked) selected.add(i); else selected.delete(i);
            box.querySelectorAll('.merchant-item').forEach((el, idx) => el.classList.toggle('selected', selected.has(idx)));
            updateTotal();
        };
    });

    const sellBtn = document.getElementById('sell-to-merchant-btn');
    if (sellBtn) {
        sellBtn.onclick = () => {
            if (selected.size === 0) { showNotification(t('notifications.prompt'), t('merchant.select'), 'warning'); return; }
            const list = [];
            selected.forEach((i) => {
                const it = items[i];
                list.push({ name: it.name, count: it.count });
            });
            const r = sellToMerchant(list);
            if (!r.ok) { showAlert(t('ui.sellFailed'), r.reason); return; }
            showNotification(t('notifications.sold'), t('merchant.goldSuffix', { gold: formatNumber(r.totalGold) }), 'success');
            addLog(t('ui.sellMerchantGold', { gold: formatNumber(r.totalGold) }), 'success');
            renderMerchant();
            renderGame();
        };
    }

    updateTotal();
}

function initMerchantUI() {
    const closeBtn = document.querySelector('#merchant-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeMerchant;
    const hubBtn = document.getElementById('merchant-hub-btn');
    if (hubBtn) hubBtn.onclick = () => openMerchantHub();
}
