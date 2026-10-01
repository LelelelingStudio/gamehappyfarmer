/* ============================================================
   consignmentSystem.js  —  寄卖市场
   版本：v1.0.1

   规则：
     - 用户同时最多上架 5 件（原 CONST 里是 3，你后来改的 5）
     - 定价 / 市场价 决定售出天数
     - 7 天没卖出下架
   ============================================================ */

const CONSIGN_MAX_SLOTS_OVERRIDE = 5;  // 用户明确要求最多 5 件

/* -------- 获取玩家可上架槽位 -------- */
function getConsignmentSlots() {
    /* 用户明确要求：同一时间最多 5 个产品 */
    return CONSIGN_MAX_SLOTS_OVERRIDE;
}

/* -------- 计算寄卖费用 -------- */
function getConsignmentFee(price, count = 1) {
    const base = (CONSIGNMENT_FEE_BASE || 0.03) * price * count;
    const priceRatio = (CONSIGNMENT_FEE_PRICE_RATIO || 0.05) * price * count;
    return Math.floor(base + priceRatio);
}

/* -------- 根据定价比例计算售出天数 -------- */
function calcConsignmentDays(priceRatio) {
    const tiers = CONSIGNMENT_PRICE_TIERS || [];
    for (const t of tiers) {
        if (priceRatio <= t.maxRatio) {
            const days = randInt(t.daysMin, t.daysMax);
            const willSell = Math.random() <= t.chance;
            return { days, willSell };
        }
    }
    return { days: CONSIGNMENT_EXPIRE_DAYS, willSell: false };
}

/* -------- 上架 -------- */
function listConsignment(itemName, count, price) {
    if (!gameState.consignments) gameState.consignments = [];
    if (gameState.consignments.length >= getConsignmentSlots()) {
        return { ok: false, reason: t('consign.errSlotsFull', { max: getConsignmentSlots() }) };
    }
    const item = gameState.inventory[itemName];
    if (!item || item.count < count) {
        return { ok: false, reason: t('consign.errNotEnough') };
    }

    price = Math.max(1, Math.floor(price));
    const marketPrice = (item.sellPrice || 1) * count;
    const priceRatio = price / marketPrice;

    /* 计算售出时间 */
    const { days, willSell } = calcConsignmentDays(priceRatio);

    /* 手续费 */
    const fee = getConsignmentFee(price, 1);
    if (gameState.gold < fee) {
        return { ok: false, reason: t('consign.errFeeNotEnough', { fee: formatNumber(fee) }) };
    }

    /* 扣物品 & 手续费 */
    if (!removeFromStorage(itemName, count)) {
        return { ok: false, reason: t('consign.errDeductFailed') };
    }
    spendGold(fee);

    gameState.consignments.push({
        id: uid('consign'),
        itemName,
        itemIcon: item.icon || '📦',
        itemCategory: item.category,
        count,
        price,           // 总价
        unitPrice: Math.floor(price / count),
        marketPrice,
        priceRatio,
        listedDay: gameState.day,
        expireDay: gameState.day + CONSIGNMENT_EXPIRE_DAYS,
        sellByDay: willSell ? gameState.day + days : -1,
        willSell,
        fee,
    });

    eventBus.emit(EVENTS.CONSIGN_LISTED, { itemName, count, price });
    markDirty();
    return { ok: true };
}

/* -------- 下架 -------- */
function cancelConsignment(consignmentId) {
    const idx = (gameState.consignments || []).findIndex(c => c.id === consignmentId);
    if (idx < 0) return { ok: false, reason: t('consign.errNotFound') };
    const entry = gameState.consignments[idx];

    /* 归还物品 */
    addToStorage(entry.itemName, entry.count, 1, {
        category: entry.itemCategory,
        icon: entry.itemIcon,
    });
    /* 手续费不退 */
    gameState.consignments.splice(idx, 1);
    markDirty();
    return { ok: true };
}

/* -------- 每日检查 -------- */
function checkConsignments() {
    if (!gameState.consignments) return [];
    const day = gameState.day;
    const result = { sold: [], expired: [] };

    const remaining = [];
    for (const c of gameState.consignments) {
        if (c.willSell && c.sellByDay >= 0 && day >= c.sellByDay) {
            /* 售出 */
            addGold(c.price);
            gameState.stats.totalConsignmentsSold++;
            result.sold.push(c);

            if (typeof notify !== 'undefined' && notify.consignmentSold) {
                notify.consignmentSold(c.itemName, c.price);
            }
            if (typeof showNotification === 'function') {
                showNotification(t('consign.soldTitle'), t('consign.soldBody', { name: c.itemName, count: c.count, price: formatNumber(c.price) }), 'success');
            }
            if (typeof playSfx === 'function') playSfx('coin');
        } else if (day >= c.expireDay) {
            /* 过期下架 */
            addToStorage(c.itemName, c.count, 1, {
                category: c.itemCategory,
                icon: c.itemIcon,
            });
            result.expired.push(c);

            if (typeof showNotification === 'function') {
                showNotification(t('consign.expiredTitle'), t('consign.expiredBody', { name: c.itemName }), 'warning');
            }
            eventBus.emit(EVENTS.CONSIGN_EXPIRED, c);
        } else {
            remaining.push(c);
        }
    }

    gameState.consignments = remaining;
    if (result.sold.length > 0 || result.expired.length > 0) {
        markDirty();
    }
    return result;
}