/* ============================================================
   factorySystem.js  —  加工厂
   版本：v1.0.1

   数据：
     - FACTORY_PRODUCTS_ALL       全部加工品
     - gameState.processingItems  进行中 [{ productId, startDay, totalDays, quantity, level }]
     - gameState.completedItems   已完成待领取 [{ productId, completedDay, quantity, level }]
   ============================================================ */

/* -------- 检查材料 -------- */
function checkMaterials(productId, quantity = 1) {
    const product = getFactoryProductById(productId);
    if (!product || !product.requirements) {
        return { ok: false, reason: t('factory.errNoProduct') };
    }

    for (const req of product.requirements) {
        const ing = resolveFactoryIngredient(req);
        if (!ing || !ing.name) {
            return { ok: false, reason: t('factory.errIngredientMissing') };
        }

        const have = getStorageCount(ing.name);
        const need = ing.amount * quantity;
        if (have < need) {
            return {
                ok: false,
                reason: t('factory.errNotEnough', { name: ing.name, need, have }),
                missing: { name: ing.name, icon: ing.icon, need, have },
            };
        }
    }
    return { ok: true };
}

/* -------- 检查是否可加工 -------- */
function canStartProcessing(productId, quantity = 1) {
    const product = getFactoryProductById(productId);
    if (!product) return { ok: false, reason: t('factory.errNoProduct') };
    if (gameState.level < product.unlockLevel) {
        return { ok: false, reason: t('factory.errLevelTooLow', { level: product.unlockLevel }) };
    }

    const matCheck = checkMaterials(productId, quantity);
    if (!matCheck.ok) return matCheck;

    const cost = (product.processingCost || 0) * quantity;
    if (gameState.gold < cost) {
        return { ok: false, reason: t('factory.errNotEnoughGold', { cost: formatNumber(cost) }) };
    }
    return { ok: true, cost };
}

/* -------- 开始加工 -------- */
function startProcessing(productId, quantity = 1) {
    const check = canStartProcessing(productId, quantity);
    if (!check.ok) return check;

    const product = getFactoryProductById(productId);
    if (!product) return { ok: false, reason: t('factory.errNoProduct') };

    /* 扣材料 */
    for (const req of product.requirements) {
        const ing = resolveFactoryIngredient(req);
        if (!ing || !ing.name) return { ok: false, reason: t('factory.errIngredientMissing') };
        if (!removeFromStorage(ing.name, ing.amount * quantity)) {
            return { ok: false, reason: t('factory.errDeductFailed', { name: ing.name }) };
        }
    }

    /* 扣金币 */
    const cost = (product.processingCost || 0) * quantity;
    if (!spendGold(cost)) {
        return { ok: false, reason: t('factory.errPayFailed') };
    }

    /* 加工加速道具 */
    let totalDays = product.processingTime;
    if (gameState.activeEffects.factoryBoost) {
        totalDays = Math.max(1, Math.ceil(totalDays / 2));
    }

    gameState.processingItems.push({
        productId,
        startDay: gameState.day,
        totalDays,
        quantity,
        level: product.level,
    });

    gameState.stats.totalFactoriesRun += quantity;

    eventBus.emit(EVENTS.FACTORY_STARTED, { productId, quantity });
    markDirty();
    if (typeof playSfx === 'function') playSfx('click');

    return { ok: true };
}

/* -------- 取消加工 -------- */
function cancelProcessing(index) {
    if (index < 0 || index >= gameState.processingItems.length) {
        return { ok: false, reason: t('factory.errIndex') };
    }
    const item = gameState.processingItems[index];
    const product = getFactoryProductById(item.productId);
    if (!product) return { ok: false, reason: t('factory.errNoProduct') };

    /* 退回一半材料 */
    for (const req of product.requirements) {
        const ing = resolveFactoryIngredient(req);
        if (ing && ing.name) {
            addToStorage(ing.name, Math.floor(ing.amount * item.quantity / 2), 1, {
                category: ing.kind === 'crop' ? 'crop' : product.category,
                icon: ing.icon,
            });
        }
    }
    /* 退一半金币 */
    const cost = Math.floor((product.processingCost || 0) * item.quantity / 2);
    if (cost > 0) addGold(cost);

    gameState.processingItems.splice(index, 1);
    markDirty();
    return { ok: true };
}

/* -------- 每日检查：是否有加工完成 -------- */
function checkProcessingProgress() {
    const day = gameState.day;
    const stillProcessing = [];
    let completed = 0;

    for (const item of gameState.processingItems) {
        const elapsed = day - item.startDay;
        if (elapsed >= item.totalDays) {
            gameState.completedItems.push({
                productId: item.productId,
                completedDay: day,
                quantity: item.quantity,
                level: item.level,
            });
            completed += item.quantity;

            const product = getFactoryProductById(item.productId);
            if (product && typeof showNotification === 'function') {
                showNotification(t('factory.completedTitle'), t('factory.completedBody', { name: product.name, count: item.quantity }), 'success');
            }
            if (typeof playSfx === 'function') playSfx('factoryDone');
            if (typeof notify !== 'undefined' && product && notify.factoryDone) {
                notify.factoryDone(product.name);
            }
        } else {
            stillProcessing.push(item);
        }
    }

    gameState.processingItems = stillProcessing;

    if (completed > 0) {
        markDirty();
        eventBus.emit(EVENTS.FACTORY_DONE, { completed });
    }

    return completed;
}

/* -------- 领取已完成的加工品 -------- */
function collectProduct(index) {
    if (index < 0 || index >= gameState.completedItems.length) {
        return { ok: false, reason: t('factory.errIndex') };
    }
    const item = gameState.completedItems[index];
    const product = getFactoryProductById(item.productId);
    if (!product) return { ok: false, reason: t('factory.errNoProduct') };

    if (!hasStorageSpace(item.quantity)) {
        return { ok: false, reason: t('factory.errStorageFull') };
    }

    addToStorage(product.name, item.quantity, 1, {
        category: product.category,
        icon: product.icon,
        sellPrice: product.sellPrice,
    });

    gameState.completedItems.splice(index, 1);
    eventBus.emit(EVENTS.FACTORY_COLLECTED, { productId: item.productId, quantity: item.quantity });
    markDirty();
    if (typeof playSfx === 'function') playSfx('coin');

    return { ok: true };
}

/* -------- 一键领取 -------- */
function collectAllProducts() {
    let count = 0;
    const toRemove = [];
    for (let i = 0; i < gameState.completedItems.length; i++) {
        const item = gameState.completedItems[i];
        const product = getFactoryProductById(item.productId);
        if (!product) continue;
        if (!hasStorageSpace(item.quantity)) continue;

        addToStorage(product.name, item.quantity, 1, {
            category: product.category,
            icon: product.icon,
            sellPrice: product.sellPrice,
        });
        toRemove.push(i);
        count += item.quantity;
    }

    /* 从后往前删，避免索引错位 */
    toRemove.reverse().forEach(i => gameState.completedItems.splice(i, 1));

    if (count > 0) markDirty();
    return { ok: count > 0, count };
}

/* -------- 加工厂等级（按已解锁的最高加工品等级） -------- */
function getFactoryLevel() {
    let maxLevel = 1;
    for (const item of gameState.processingItems) {
        if (item.level > maxLevel) maxLevel = item.level;
    }
    for (const item of gameState.completedItems) {
        if (item.level > maxLevel) maxLevel = item.level;
    }
    const fromLevel = Math.min(FACTORY_LEVEL_COUNT, Math.floor(gameState.level / 30) + 1);
    return Math.max(maxLevel, fromLevel);
}