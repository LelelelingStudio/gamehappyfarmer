/* ============================================================
   merchantSystem.js  —  植物商人
   版本：v1.0.1
   ============================================================ */

/* -------- 计算商人对某物品的出价 -------- */
function getMerchantPrice(itemName, count = 1, merchant = null) {
    const item = gameState.inventory[itemName];
    if (!item) return 0;

    if (!merchant) {
        merchant = getMerchantById(gameState.merchant.currentMerchantId);
    }
    if (!merchant) return 0;

    const rules = merchant.priceRules || {};
    const basePrice = item.sellPrice || 0;
    let mult = rules.default || 1.0;

    /* 分类加成 */
    if (rules.categoryBonus && item.category && rules.categoryBonus[item.category]) {
        mult *= rules.categoryBonus[item.category];
    }

    /* 大单加成 */
    if (rules.bulkThreshold && count >= rules.bulkThreshold) {
        mult *= (rules.bulkMultiplier || 1.0);
    }

    /* 全局商人加成（道具效果） */
    if (gameState.activeEffects.merchantBoost) {
        mult *= (1 + gameState.activeEffects.merchantBoost);
    }

    return Math.floor(basePrice * count * mult);
}

/* -------- 商人是否收购这个物品 -------- */
function merchantAccepts(itemName, merchant = null) {
    const item = gameState.inventory[itemName];
    if (!item) return false;

    if (!merchant) {
        merchant = getMerchantById(gameState.merchant.currentMerchantId);
    }
    if (!merchant) return false;

    const rules = merchant.acceptsRules || {};
    if (rules.minItemLevel !== undefined) {
        /* 物品可能在入仓时没记录等级（例如收获的作物），按名字回查数据，
           否则「只收 15 级以上」的商人会拒收玩家所有普通收获物。 */
        let lvl = item.unlockLevel != null ? item.unlockLevel : item.level;
        if (lvl == null && typeof CROPS_BY_NAME !== 'undefined' && CROPS_BY_NAME[itemName]) {
            lvl = CROPS_BY_NAME[itemName].unlockLevel;
        }
        if (lvl == null && typeof FACTORY_PRODUCTS_BY_NAME !== 'undefined' && FACTORY_PRODUCTS_BY_NAME[itemName]) {
            lvl = FACTORY_PRODUCTS_BY_NAME[itemName].unlockLevel;
        }
        if (lvl == null && typeof MALL_ITEMS !== 'undefined') {
            const mall = MALL_ITEMS.find((m) => m.name === itemName);
            if (mall) lvl = mall.unlockLevel;
        }
        lvl = lvl || 0;
        if (lvl < rules.minItemLevel) return false;
    }
    if (rules.categories && Array.isArray(rules.categories)) {
        if (!rules.categories.includes(item.category)) return false;
    }
    return true;
}

/* -------- 呼叫商人：花费 = 距离下次来访的天数 × 200 -------- */
const MERCHANT_CALL_PRICE_PER_DAY = 200;

function getMerchantCallCost() {
    const m = gameState.merchant;
    const days = Math.max(1, Number(m.nextVisit) || 1);
    return days * MERCHANT_CALL_PRICE_PER_DAY;
}

/** 花金币把指定的商人立刻叫来 */
function callMerchant(merchantId) {
    const merchant = getMerchantById(merchantId);
    if (!merchant) return { ok: false, reason: t('trade.errMerchantMissing') };

    const m = gameState.merchant;
    if (m.present && m.currentMerchantId === merchantId) {
        return { ok: false, reason: t('trade.errMerchantAlready') };
    }

    const cost = getMerchantCallCost();
    if (gameState.gold < cost) return { ok: false, reason: t('trade.errGoldNeed', { cost: formatNumber(cost) }) };
    if (!spendGold(cost)) return { ok: false, reason: t('trade.errGoldNeed', { cost: formatNumber(cost) }) };

    /* 前一位商人被替换掉 */
    m.present = true;
    m.currentMerchantId = merchantId;
    m.lastMerchantId = merchantId;
    m.daysRemaining = 3;

    /* 下一场自然来访重新计时 */
    const isEarly = gameState.day <= (typeof MERCHANT_EARLY_DAYS !== 'undefined' ? MERCHANT_EARLY_DAYS : 30);
    m.nextVisit = isEarly
        ? randInt(MERCHANT_VISIT_EARLY_MIN, MERCHANT_VISIT_EARLY_MAX)
        : randInt(MERCHANT_VISIT_NORMAL_MIN, MERCHANT_VISIT_NORMAL_MAX);

    eventBus.emit(EVENTS.MERCHANT_ARRIVED, { merchantId });
    if (typeof playSfx === 'function') playSfx('notify');
    markDirty();
    return { ok: true, name: merchant.name, cost, days: m.daysRemaining };
}

/* -------- 每天检查是否商人来访 -------- */
function checkMerchant() {
    const m = gameState.merchant;

    /* 如果正在场，倒计时 */
    if (m.present) {
        m.daysRemaining--;
        if (m.daysRemaining <= 0) {
            m.present = false;
            m.daysRemaining = 0;
            eventBus.emit(EVENTS.MERCHANT_LEFT, {});
            if (typeof showNotification === 'function') {
                showNotification(t('merchant.leftTitle'), t('merchant.leftBody'), 'info');
            }
            console.log(`[Merchant System] 商人 ${m.currentMerchantId} 离开`);
        }
        return;
    }

    /* 不在场，检查是否该来 */
    m.nextVisit--;
    if (m.nextVisit > 0) return;

    /* 该来了，选一个商人 */
    const merchant = pickRandomMerchant(m.lastMerchantId);
    if (!merchant) return;
    console.log(`[Merchant System] 商人 ${merchant.name} 到访，停留 ${m.daysRemaining} 天`);


    m.present = true;
    m.currentMerchantId = merchant.id;
    m.lastMerchantId = merchant.id;
    m.daysRemaining = 3;  // 停留 3 天

    /* 下次来访时间 */
    const isEarly = gameState.day <= MERCHANT_EARLY_DAYS;
    if (isEarly) {
        m.nextVisit = randInt(MERCHANT_VISIT_EARLY_MIN, MERCHANT_VISIT_EARLY_MAX);
    } else {
        m.nextVisit = randInt(MERCHANT_VISIT_NORMAL_MIN, MERCHANT_VISIT_NORMAL_MAX);
    }

    eventBus.emit(EVENTS.MERCHANT_ARRIVED, { merchantId: merchant.id });
    if (typeof playSfx === 'function') playSfx('notify');
    if (typeof showNotification === 'function') {
        showNotification(t('merchant.arrivedTitle'), t('merchant.arrivedBody', { name: merchant.name }), 'success');
    }
    if (typeof notify !== 'undefined' && notify.merchantArrived) {
        notify.merchantArrived(merchant.name);
    }
    markDirty();
}

/* -------- 出售给商人 -------- */
function sellToMerchant(sellList) {
    /* sellList = [{ name, count }, ...] */
    if (!gameState.merchant.present) {
        console.warn(`[Merchant System] 出售失败：商人不在场`);
        return { ok: false, reason: t('merchant.errAbsent') };
    }
    if (!sellList || sellList.length === 0) {
        console.warn(`[Merchant System] 出售失败：没有选中物品`);
        return { ok: false, reason: t('merchant.errNoSelection') };
    }
    const merchant = getMerchantById(gameState.merchant.currentMerchantId);
    if (!merchant) {
        console.warn(`[Merchant System] 出售失败：商人数据缺失`);
        return { ok: false, reason: t('merchant.errNoData') };
    }

    let totalGold = 0;
    let totalItems = 0;

    /* 先校验 */
    for (const entry of sellList) {
        if (!merchantAccepts(entry.name, merchant)) {
            console.warn(`[Merchant System] 出售失败：${entry.name} 商人不收`);
            return { ok: false, reason: t('merchant.errNotAccepted', { name: entry.name }) };
        }
        const have = getStorageCount(entry.name);
        if (have < entry.count) {
            console.warn(`[Merchant System] 出售失败：${entry.name} 数量不足`);
            return { ok: false, reason: t('merchant.errNotEnough', { name: entry.name }) };
        }
    }

    /* 执行出售 */
    for (const entry of sellList) {
        const price = getMerchantPrice(entry.name, entry.count, merchant);
        if (!removeFromStorage(entry.name, entry.count)) continue;
        totalGold += price;
        totalItems += entry.count;
    }

    if (totalGold > 0) {
        addGold(totalGold);
    }

    gameState.stats.totalItemsSold += totalItems;

    eventBus.emit(EVENTS.MERCHANT_SOLD, { totalGold, totalItems });
    if (typeof playSfx === 'function') playSfx('coin');
    markDirty();

    return { ok: true, totalGold, totalItems };
}

/* -------- 当前商人的全部可收物品（用于 UI） -------- */
function getMerchantSellableItems() {
    if (!gameState.merchant.present) return [];
    const merchant = getMerchantById(gameState.merchant.currentMerchantId);
    if (!merchant) return [];

    const result = [];
    for (const name in gameState.inventory) {
        const item = gameState.inventory[name];
        if (!item || item.count <= 0) continue;
        if (!merchantAccepts(name, merchant)) continue;
        result.push({
            name,
            count: item.count,
            icon: item.icon || '📦',
            category: item.category,
            unitPrice: getMerchantPrice(name, 1, merchant),
            totalPrice: getMerchantPrice(name, item.count, merchant),
        });
    }
    console.log(`[Merchant System] 可出售物品列表:`, result);
    return result;
}