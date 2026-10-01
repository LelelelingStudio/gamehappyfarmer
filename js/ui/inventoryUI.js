/* ============================================================
   inventoryUI.js  —  仓库
   ============================================================ */

function renderInventory() {
    const container = document.getElementById('inventory');
    if (!container) return;

    if (typeof updateStorageUsage === 'function') updateStorageUsage();

    /* 更新容量条 */
    const usedEl = document.getElementById('storage-used');
    const capEl  = document.getElementById('storage-capacity');
    const barEl  = document.getElementById('storage-progress');
    if (usedEl) usedEl.textContent = gameState.storageUsed;
    if (capEl)  capEl.textContent  = gameState.storageCapacity;
    if (barEl) {
        const p = Math.min(100, (gameState.storageUsed / gameState.storageCapacity) * 100);
        barEl.style.width = p.toFixed(1) + '%';
    }

    /* 物品列表 */
    const keys = Object.keys(gameState.inventory);
    if (keys.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:20px;text-align:center;color:#999">' + t('ui.emptyState.emptyInventory') + '</div>';
        const totalEl = document.getElementById('inventory-value');
        if (totalEl) totalEl.textContent = '0';
        return;
    }

    let totalValue = 0;
    const html = keys.map(name => {
        const item = gameState.inventory[name];
        if (!item || item.count <= 0) return '';
        const value = (item.sellPrice || 0) * item.count;
        totalValue += value;
        return `
            <div class="inventory-item" data-name="${name}" style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #eee">
                <div>${item.icon || '📦'} ${name} ×${item.count}</div>
                <div style="color:#ff9800;font-weight:bold">${value}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    const totalEl = document.getElementById('inventory-value');
    if (totalEl) totalEl.textContent = formatNumber(totalValue);

    /* 点击出售（如果商人在场） */
    container.querySelectorAll('.inventory-item').forEach(el => {
        el.onclick = () => {
            if (!gameState.merchant.present) return;
            const name = el.dataset.name;
            const count = getStorageCount(name);
            if (count <= 0) return;
            showNumberPrompt(t('ui.sellPrompt', { name }), t('ui.sellMaxPrompt', { count }), count, 1, count)
                .then(n => {
                    if (!n) return;
                    const r = sellToMerchant([{ name, count: n }]);
                    if (!r.ok) { showAlert(t('ui.buyLandFailed'), r.reason); return; }
                    showNotification(t('notifications.sold'), t('merchant.goldSuffix', { gold: formatNumber(r.totalGold) }), 'success');
                    renderGame();
                });
        };
    });
}