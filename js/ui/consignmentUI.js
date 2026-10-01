/* ============================================================
   consignmentUI.js  —  寄卖市场
   ============================================================ */

function openConsignment() {
    const dlg = document.getElementById('consign-dialog');
    if (dlg) dlg.classList.add('show');
    renderConsignments();
}

function closeConsignment() {
    const dlg = document.getElementById('consign-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderConsignments() {
    /* 左侧：可上架物品 */
    const left = document.getElementById('consign-inventory');
    if (left) {
        const keys = Object.keys(gameState.inventory);
        if (keys.length === 0) {
            left.innerHTML = '<div class="empty-state">' + t('ui.emptyState.emptyInventory') + '</div>';
        } else {
            left.innerHTML = keys.map(name => {
                const it = gameState.inventory[name];
                if (!it || it.count <= 0) return '';
                return `
                    <div class="consign-inv-item" data-name="${name}" style="padding:8px;border-bottom:1px solid #eee;cursor:pointer">
                        ${it.icon || '📦'} ${name} ×${it.count}
                    </div>
                `;
            }).join('');
            left.querySelectorAll('.consign-inv-item').forEach(el => {
                el.onclick = () => promptListConsignment(el.dataset.name);
            });
        }
    }

    /* 右侧：我的寄卖 */
    const right = document.getElementById('consign-list');
    const cntEl = document.getElementById('consign-count');
    const maxEl = document.getElementById('consign-max');
    if (cntEl) cntEl.textContent = gameState.consignments.length;
    if (maxEl) maxEl.textContent = getConsignmentSlots();

    if (!right) return;
    if (gameState.consignments.length === 0) {
        right.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noConsignments') + '</div>';
        return;
    }
    right.innerHTML = gameState.consignments.map(c => `
        <div style="padding:10px;border-bottom:1px solid #eee">
            <div style="display:flex;justify-content:space-between">
                <div>${c.itemIcon} ${c.itemName} ×${c.count}</div>
                <div style="color:#ff9800;font-weight:bold">${c.price} 💰</div>
            </div>
            <div style="font-size:0.8rem;color:#666">${t('ui.consignmentExpired', { day: c.listedDay })}</div>
            <button class="btn btn-small" data-cancel="${c.id}" style="margin-top:5px">${t('common.remove')}</button>
        </div>
    `).join('');
    right.querySelectorAll('button[data-cancel]').forEach(btn => {
        btn.onclick = () => {
            const r = cancelConsignment(btn.dataset.cancel);
            if (r.ok) { showNotification(t('common.remove'), '', 'info'); renderConsignments(); renderInventory(); }
        };
    });
}

function promptListConsignment(name) {
    const count = getStorageCount(name);
    if (count <= 0) return;
    showNumberPrompt(t('ui.consignmentPrompt', { name }), t('ui.consignmentAmountPrompt', { count }), 1, 1, count).then(n => {
        if (!n) return;
        const it = gameState.inventory[name];
        const unit = it.sellPrice || 1;
        showNumberPrompt(t('ui.consignmentPricePrompt', { name }), t('ui.consignmentPriceHint', { unit }), unit, 1, unit * 10)
            .then(price => {
                if (!price) return;
                const r = listConsignment(name, n, price * n);
                if (!r.ok) { showAlert(t('ui.consignmentFail'), r.reason); return; }
                showNotification(t('ui.consignmentSuccess'), t('ui.storedItem', { name, count: n }), 'success');
                renderConsignments();
                renderInventory();
            });
    });
}

function initConsignmentUI() {
    const closeBtn = document.querySelector('#consign-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeConsignment;
}