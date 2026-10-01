/* ============================================================
   currencySystem.js  —  5 级货币系统
   版本：v1.0.1

   存储方案：
     - gameState.gold         = 铜板（最基础货币，沿用已有字段）
     - gameState.currencies   = { copperCoin, silver, goldCoin, diamond }
       （动态创建，见 initCurrencies）

   兑换规则：
     - 向上：花 110 低级货币 → 1 高级货币
     - 向下：花 1 高级货币 → 100 低级货币
   ============================================================ */

/* -------- 初始化 -------- */
function initCurrencies() {
    if (!gameState.currencies) {
        gameState.currencies = {
            copperCoin: 0,
            silver:     0,
            goldCoin:   0,
            diamond:    0,
        };
    }
}

/* -------- 余额查询 / 修改 -------- */
function getCurrencyBalance(currencyId) {
    if (currencyId === 'copper') return gameState.gold;
    initCurrencies();
    return gameState.currencies[currencyId] || 0;
}

function setCurrencyBalance(currencyId, amount) {
    amount = Math.max(0, Math.floor(amount));
    if (currencyId === 'copper') {
        gameState.gold = amount;
    } else {
        initCurrencies();
        gameState.currencies[currencyId] = amount;
    }
    markDirty();
}

function addCurrency(currencyId, amount) {
    if (amount <= 0) return;
    setCurrencyBalance(currencyId, getCurrencyBalance(currencyId) + amount);
}

function spendCurrency(currencyId, amount) {
    if (amount <= 0) return true;
    const bal = getCurrencyBalance(currencyId);
    if (bal < amount) return false;
    setCurrencyBalance(currencyId, bal - amount);
    return true;
}

/* -------- 全部货币折算成铜板（用于总资产显示） -------- */
function getTotalCopper() {
    initCurrencies();
    let total = gameState.gold;
    total += (gameState.currencies.copperCoin || 0) * 100;
    total += (gameState.currencies.silver     || 0) * Math.pow(100, 2);
    total += (gameState.currencies.goldCoin   || 0) * Math.pow(100, 3);
    total += (gameState.currencies.diamond    || 0) * Math.pow(100, 4);
    return total;
}

/* -------- 兑换：向上 -------- */
function canExchangeUp(currencyId, amount) {
    if (amount <= 0) return { ok: false, reason: t('currency.errInvalidAmount') };
    const cur = getCurrencyById(currencyId);
    if (!cur || cur.level <= 1) {
        return { ok: false, reason: t('currency.errLowestUp') };
    }
    const lower = getCurrencyByLevel(cur.level - 1);
    const need  = amount * CURRENCY_UP_RATE;
    const bal   = getCurrencyBalance(lower.id);
    if (bal < need) {
        return { ok: false, reason: t('currency.errNeedLower', { need: formatNumber(need), name: lower.name, have: formatNumber(bal) }) };
    }
    return { ok: true, need, lower };
}

function exchangeUp(currencyId, amount) {
    const check = canExchangeUp(currencyId, amount);
    if (!check.ok) return check;

    spendCurrency(check.lower.id, check.need);
    addCurrency(currencyId, amount);

    /* 历史记录（只保留最近 100 条） */
    gameState.currencyHistory.push({
        time: Date.now(), type: 'up',
        from: check.lower.id, fromAmount: check.need,
        to: currencyId, toAmount: amount,
    });
    if (gameState.currencyHistory.length > 100) {
        gameState.currencyHistory = gameState.currencyHistory.slice(-100);
    }

    markDirty();
    eventBus.emit(EVENTS.CURRENCY_EXCHANGED, { direction: 'up', from: check.lower.id, to: currencyId, amount });
    return { ok: true };
}

/* -------- 兑换：向下 -------- */
function canExchangeDown(currencyId, amount) {
    if (amount <= 0) return { ok: false, reason: t('currency.errInvalidAmount') };
    const cur = getCurrencyById(currencyId);
    if (!cur || cur.level <= 1) {
        return { ok: false, reason: t('currency.errLowestDown') };
    }
    const bal = getCurrencyBalance(currencyId);
    if (bal < amount) {
        return { ok: false, reason: t('currency.errOnlyHave', { have: formatNumber(bal), name: cur.name }) };
    }
    const lower = getCurrencyByLevel(cur.level - 1);
    const gain  = amount * CURRENCY_DOWN_RATE;
    return { ok: true, gain, lower };
}

function exchangeDown(currencyId, amount) {
    const check = canExchangeDown(currencyId, amount);
    if (!check.ok) return check;

    spendCurrency(currencyId, amount);
    addCurrency(check.lower.id, check.gain);

    gameState.currencyHistory.push({
        time: Date.now(), type: 'down',
        from: currencyId, fromAmount: amount,
        to: check.lower.id, toAmount: check.gain,
    });
    if (gameState.currencyHistory.length > 100) {
        gameState.currencyHistory = gameState.currencyHistory.slice(-100);
    }

    markDirty();
    eventBus.emit(EVENTS.CURRENCY_EXCHANGED, { direction: 'down', from: currencyId, to: check.lower.id, amount });
    return { ok: true };
}

/* -------- 玩家持有货币的展示字符串 -------- */
function formatPlayerCurrency() {
    initCurrencies();
    const parts = [];
    if (gameState.currencies.diamond    > 0) parts.push(`${gameState.currencies.diamond} 💎`);
    if (gameState.currencies.goldCoin   > 0) parts.push(`${gameState.currencies.goldCoin} 🟡`);
    if (gameState.currencies.silver     > 0) parts.push(`${gameState.currencies.silver} ⚪`);
    if (gameState.currencies.copperCoin > 0) parts.push(`${gameState.currencies.copperCoin} 🟠`);
    if (gameState.gold > 0 || parts.length === 0) parts.push(`${gameState.gold} 🟤`);
    return parts.join(' ');
}