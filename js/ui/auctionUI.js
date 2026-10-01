/* ============================================================
   auctionUI.js  —  拍卖会（玩家专场 / NPC 专场）
   ============================================================ */

function openAuction() {
    const dlg = document.getElementById('auction-dialog');
    if (dlg) dlg.classList.add('show');
    renderAuction();
}

function closeAuction() {
    const dlg = document.getElementById('auction-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderAuction() {
    const box = document.getElementById('auction-body');
    if (!box) return;

    const a = gameState.auction.active;

    /* 没有进行中的拍卖 → 玩家自己开拍的入口 */
    if (!a || a.finished) {
        const canStart = canStartAuction();
        const nextDay = getNextAuctionDay();
        box.innerHTML = `
            <div class="auction-panel">
                <p class="auction-meta">${t('ui.auctionStartPrompt')}</p>
                <p class="auction-meta">${canStart.ok
                    ? t('ui.auctionAvailable')
                    : t('auction.errNotYet', { days: Math.max(0, nextDay - gameState.day) })}</p>
                ${canStart.ok ? `<div class="auction-actions"><button class="btn btn-primary" id="start-auction-btn">${t('ui.startAuction')}</button></div>` : ''}
                ${a && a.finished ? `<p class="auction-meta">${t('ui.auctionFinished')}</p>
                    <div class="auction-actions"><button class="btn" id="clear-auction-btn">${t('auction.clear')}</button></div>` : ''}
                <p class="auction-meta auction-npc-hint">${t('auction.npcHint')}</p>
            </div>
        `;
        const btn = document.getElementById('start-auction-btn');
        if (btn) btn.onclick = () => promptStartAuction();
        const clearBtn = document.getElementById('clear-auction-btn');
        if (clearBtn) clearBtn.onclick = () => { clearFinishedAuction(); renderAuction(); };
        return;
    }

    /* 进行中 */
    const isSeller = !!a.playerIsSeller;
    const leaderName = a.currentBidder === 'player'
        ? t('auction.you')
        : (((a.bidders || []).find((b) => b.id === a.currentBidder) || {}).name || t('auction.none'));

    box.innerHTML = `
        <div class="auction-panel">
            <div class="auction-host">
                <span class="auction-host-tag ${isSeller ? 'seller' : 'buyer'}">
                    ${isSeller ? t('auction.youAreSeller') : t('auction.hostIs', { host: a.hostName || '' })}
                </span>
            </div>
            <h4 class="auction-title">${a.itemIcon || '📦'} ${a.itemName} ×${a.count}</h4>
            <div class="auction-price">${t('auction.currentPrice')}：<b>${formatNumber(a.currentPrice)}</b> 💰</div>
            <div class="auction-meta">${t('auction.leader')}：${leaderName}</div>
            <div class="auction-meta">${t('auction.minStep', { step: formatNumber(a.minStep) })}</div>
            <div class="auction-actions">
                ${isSeller
                    ? `<span class="auction-meta">${t('auction.sellerNoBid')}</span>`
                    : `<button class="btn btn-primary" id="bid-btn">${t('auction.bidNow')} +${formatNumber(a.minStep)}</button>
                       <button class="btn btn-small" id="bid-custom-btn">${t('auction.bidCustom')}</button>`}
            </div>
            <div class="auction-history">
                <h5>${t('auction.history')}</h5>
                ${(a.bidHistory || []).slice(-8).map((h) => `<div class="auction-history-row">${t('auction.historyRow', { day: h.day, bidder: h.bidder, price: formatNumber(h.price) })}</div>`).join('')}
            </div>
        </div>
    `;

    const btn = document.getElementById('bid-btn');
    if (btn) {
        btn.onclick = () => {
            const r = placePlayerBid(a.currentPrice + a.minStep);
            if (!r.ok) { showNotification(t('auction.bidFail'), r.reason, 'warning'); return; }
            showNotification(t('auction.bidSuccess'), '', 'success');
            renderAuction();
        };
    }
    const custom = document.getElementById('bid-custom-btn');
    if (custom) {
        custom.onclick = () => {
            showNumberPrompt(
                t('auction.bidCustom'),
                t('auction.bidCustomHint', { min: formatNumber(a.currentPrice + a.minStep) }),
                a.currentPrice + a.minStep,
                a.currentPrice + a.minStep,
                999999999
            ).then((v) => {
                if (v === null || v === undefined) return;
                const r = placePlayerBid(v);
                if (!r.ok) { showNotification(t('auction.bidFail'), r.reason, 'warning'); return; }
                showNotification(t('auction.bidSuccess'), '', 'success');
                renderAuction();
            });
        };
    }
}

function promptStartAuction() {
    const box = document.getElementById('auction-body');
    if (!box) return;
    const keys = Object.keys(gameState.inventory || {}).filter((k) => (gameState.inventory[k].count || 0) > 0);
    if (keys.length === 0) { showAlert(t('auction.noInventory'), t('auction.noInventory')); return; }

    box.innerHTML = `
        <div class="auction-panel">
            <h4 class="auction-title">${t('auction.pickItem')}</h4>
            <div class="auction-pick-list scrollable">
                ${keys.map((k) => {
                    const it = gameState.inventory[k];
                    return `<div class="auction-pick-item" data-name="${k}">
                        <span>${it.icon || '📦'} ${k} ×${it.count}</span>
                        <span class="auction-pick-price">${formatNumber(it.sellPrice || 0)} 💰</span>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `;
    box.querySelectorAll('.auction-pick-item').forEach((el) => {
        el.onclick = () => askAuctionDetails(el.dataset.name);
    });
}

function askAuctionDetails(name) {
    const item = gameState.inventory[name];
    if (!item) return;
    showNumberPrompt(t('auction.quantity'), t('auction.maxQuantity', { count: item.count }), 1, 1, item.count).then((n) => {
        if (n === null || n === undefined) return;
        const market = (item.sellPrice || 1) * n;
        showNumberPrompt(
            t('auction.startingPrice'),
            t('auction.suggest', { price: formatNumber(Math.floor(market * 0.8)) }),
            Math.max(1, Math.floor(market * 0.5)),
            1,
            Math.floor(market * 0.8)
        ).then((p) => {
            if (p === null || p === undefined) return;
            const r = startAuction(name, n, p);
            if (!r.ok) { showAlert(t('auction.startFail'), r.reason); return; }
            showNotification(t('auction.startOk'), name, 'success');
            renderAuction();
        });
    });
}

function initAuctionUI() {
    const closeBtn = document.querySelector('#auction-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeAuction;
}
