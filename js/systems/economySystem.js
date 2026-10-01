/* ============================================================
   economySystem.js  —  金币 / 经验 / 等级 / 仓库
   版本：v1.0.1
   ============================================================ */

/* -------- 金币 -------- */
function addGold(amount) {
    if (amount <= 0) return;
    /* 道具加成：金币增益（永久百分比）+ 双倍金币（限时） */
    const eff = gameState.activeEffects || {};
    let mult = 1 + (Number(eff.goldBoost) || 0);
    if (eff.doubleGold) mult *= 2;
    const finalAmount = Math.max(1, Math.floor(amount * mult));
    gameState.gold += finalAmount;
    gameState.stats.totalGoldEarned += finalAmount;
    markDirty();
    eventBus.emit(EVENTS.GOLD_GAINED, finalAmount);
}

function spendGold(amount) {
    if (amount <= 0) return true;
    if (gameState.gold < amount) return false;
    gameState.gold -= amount;
    gameState.stats.totalGoldSpent += amount;
    markDirty();
    eventBus.emit(EVENTS.GOLD_SPENT, amount);
    return true;
}

/* -------- 经验 / 升级 -------- */
function addExp(amount) {
    if (amount <= 0) return;
    /* 道具加成：经验增益（永久百分比）+ 双倍经验（限时） */
    const eff = gameState.activeEffects || {};
    let mult = 1 + (Number(eff.xpBoost) || 0);
    if (eff.doubleXP) mult *= 2;
    const finalAmount = Math.max(1, Math.floor(amount * mult));
    gameState.exp += finalAmount;
    eventBus.emit(EVENTS.EXP_GAINED, finalAmount);
    checkLevelUp();
    markDirty();
}

function checkLevelUp() {
    let leveled = false;

    while (gameState.exp >= gameState.expToNextLevel) {
        gameState.exp -= gameState.expToNextLevel;
        gameState.level++;
        gameState.expToNextLevel = Math.floor(
            EXP_BASE * Math.pow(EXP_GROWTH, gameState.level - 1)
        );

        addGold(LEVEL_REWARD_GOLD);
        leveled = true;

        eventBus.emit(EVENTS.LEVEL_UP, gameState.level);

        if (typeof playSfx === 'function') playSfx('levelUp');
        if (typeof showNotification === 'function') {
            showNotification(t('economy.levelUpTitle'), t('economy.levelUpBody', { level: gameState.level }), 'success');
        }
        if (typeof checkSkinUnlock === 'function')  checkSkinUnlock();
        if (typeof checkAchievements === 'function') checkAchievements();
    }

    /* 升级后立即刷新界面：否则顶栏等级/经验停在旧值，玩家会以为没有升级 */
    if (leveled && typeof renderGame === 'function') {
        renderGame();
    }
    return leveled;
}

/* -------- 仓库 -------- */
function updateStorageUsage() {
    let used = 0;
    for (const key in gameState.inventory) {
        const item = gameState.inventory[key];
        if (item && item.count > 0) {
            used += (item.size || 1) * item.count;
        }
    }
    gameState.storageUsed = used;
    eventBus.emit(EVENTS.STORAGE_CHANGED, used);
}

function hasStorageSpace(size = 1) {
    return gameState.storageUsed + size <= gameState.storageCapacity;
}

function addToStorage(name, count = 1, size = 1, extra = {}) {
    if (count <= 0) return false;
    const totalSize = size * count;
    if (!hasStorageSpace(totalSize)) return false;

    if (!gameState.inventory[name]) {
        gameState.inventory[name] = { name, count: 0, size, ...extra };
    }
    gameState.inventory[name].count += count;
    updateStorageUsage();
    markDirty();
    return true;
}

function removeFromStorage(name, count = 1) {
    const item = gameState.inventory[name];
    if (!item || item.count < count) return false;
    item.count -= count;
    if (item.count <= 0) delete gameState.inventory[name];
    updateStorageUsage();
    markDirty();
    return true;
}

function getStorageCount(name) {
    const item = gameState.inventory[name];
    return item ? item.count : 0;
}

/* -------- 升级仓库 -------- */
function upgradeStorage() {
    if (!spendGold(STORAGE_UPGRADE_COST)) {
        if (typeof showNotification === 'function') {
            showNotification(t('ui.goldNotEnough'), t('economy.storageNeedGold', { cost: formatNumber(STORAGE_UPGRADE_COST) }), 'warning');
        }
        return false;
    }
    gameState.storageCapacity += STORAGE_UPGRADE_AMOUNT;
    eventBus.emit(EVENTS.STORAGE_UPGRADED, gameState.storageCapacity);
    if (typeof showNotification === 'function') {
        showNotification(t('economy.storageUpgradedTitle'), t('economy.storageUpgradedBody', { amount: STORAGE_UPGRADE_AMOUNT }), 'success');
    }
    markDirty();
    return true;
}