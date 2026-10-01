/* ============================================================
   tradeSystem.js  —  低价甩卖 / 二手市场 / 呼叫商人
   ============================================================ */

/* ============================================================
   一、低价甩卖（市场价的 40% ~ 60%）
   ============================================================ */
const QUICK_SELL_MIN_RATIO = 0.40;
const QUICK_SELL_MAX_RATIO = 0.60;

/** 某个物品的甩卖单价（每次打开弹窗时随机落在 40%~60%） */
function rollQuickSellRatio() {
    return QUICK_SELL_MIN_RATIO + Math.random() * (QUICK_SELL_MAX_RATIO - QUICK_SELL_MIN_RATIO);
}

/** 组装可甩卖清单 [{name, count, unit, ratio, total}] */
function getQuickSellList() {
    const out = [];
    for (const name of Object.keys(gameState.inventory || {})) {
        const item = gameState.inventory[name];
        if (!item || item.count <= 0) continue;
        if (item.category === 'seed') continue;           /* 种子不参与甩卖，避免误卖 */
        const base = item.sellPrice || 0;
        if (base <= 0) continue;
        const ratio = rollQuickSellRatio();
        const unit = Math.max(1, Math.floor(base * ratio));
        out.push({ name, count: item.count, icon: item.icon || '📦', category: item.category, unit, ratio, total: unit * item.count });
    }
    out.sort((a, b) => b.total - a.total);
    return out;
}

/** 执行甩卖：list = [{name, count}] */
function quickSell(list) {
    if (!list || list.length === 0) return { ok: false, reason: t('trade.errNoSelection') };
    let gold = 0;
    let items = 0;
    const detail = [];
    for (const entry of list) {
        const item = gameState.inventory[entry.name];
        if (!item || item.count < entry.count) return { ok: false, reason: t('trade.errNotEnough', { name: entry.name }) };
        const unit = Math.max(1, Math.floor((item.sellPrice || 0) * rollQuickSellRatio()));
        if (!removeFromStorage(entry.name, entry.count)) return { ok: false, reason: t('trade.errRemove', { name: entry.name }) };
        gold += unit * entry.count;
        items += entry.count;
        detail.push({ name: entry.name, count: entry.count, unit });
    }
    if (gold > 0) addGold(gold);
    gameState.stats.totalItemsSold = (gameState.stats.totalItemsSold || 0) + items;
    markDirty();
    return { ok: true, gold, items, detail };
}

/* ============================================================
   二、二手市场
   —— 更便宜，但效果打折：种子长得慢/更易生病，肥料效果减弱
   ============================================================ */

const SECOND_HAND_SEED_SUFFIX = '（二手）';
const SECOND_HAND_PRICE_RATIO = 0.45;        /* 二手价约 45% */
const SECOND_HAND_GROWTH_PENALTY = 0.75;     /* 生长速度 ×0.75 */
const SECOND_HAND_SICK_MULT = 2.2;           /* 生病概率 ×2.2 */

/** 每日二手市场货架（同一天内稳定，跨天刷新） */
function getSecondHandStock() {
    const seed = gameState.day * 7919 + gameState.level;
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };

    const stock = [];

    /* 1) 二手种子：玩家等级附近的作物，最多 6 种 */
    const pool = (typeof CROPS_ALL !== 'undefined' ? CROPS_ALL : [])
        .filter((c) => c.unlockLevel <= gameState.level + 6);
    if (pool.length > 0) {
        const picked = new Set();
        const want = Math.min(6, pool.length);
        while (picked.size < want) picked.add(Math.floor(rnd() * pool.length));
        for (const idx of picked) {
            const c = pool[idx];
            stock.push({
                kind: 'seed',
                key: 'seed_' + c.id,
                name: c.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子') + SECOND_HAND_SEED_SUFFIX,
                display: c.icon + ' ' + c.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子') + SECOND_HAND_SEED_SUFFIX,
                cropId: c.id,
                icon: '🌱',
                price: Math.max(1, Math.floor(c.price * SECOND_HAND_PRICE_RATIO)),
                note: t('trade.noteSeedSlow'),
            });
        }
    }

    /* 2) 二手肥料：效果打折 */
    if (typeof FERTILIZERS !== 'undefined') {
        for (const fert of FERTILIZERS.slice(0, Math.min(3, FERTILIZERS.length))) {
            stock.push({
                kind: 'fertilizer',
                key: 'fert_' + fert.id,
                name: fert.name + '（二手）',
                display: fert.icon + ' ' + fert.name + '（二手）',
                fertId: fert.id,
                icon: fert.icon,
                price: Math.max(1, Math.floor((fert.price || 50) * SECOND_HAND_PRICE_RATIO)),
                note: t('trade.noteFertWeak'),
            });
        }
    }

    return stock;
}

/** 购买二手商品 */
function buySecondHand(entry) {
    if (!entry) return { ok: false };
    if (gameState.gold < entry.price) return { ok: false, reason: t('trade.errGold') };

    spendGold(entry.price);

    if (entry.kind === 'seed') {
        /* 二手种子以独立物品入仓：种植时走 plantCrop(..., {secondHand:true}) */
        addToStorage(entry.name, 1, 1, {
            category: 'seed', icon: '🌱', sellPrice: 1,
            cropId: entry.cropId, secondHand: true,
        });
    } else {
        addToStorage(entry.name, 1, 1, {
            category: 'fertilizer', icon: entry.icon || '🌿',
            weak: true, fertilityRatio: 0.5,
        });
    }

    markDirty();
    return { ok: true };
}

/* 判定某个仓库物品是否是二手种子 */
function isSecondHandSeedItem(name) {
    return typeof name === 'string' && name.indexOf(SECOND_HAND_SEED_SUFFIX) >= 0;
}

/* ============================================================
   三、其他商城（辅助用品 + 限时种子 + 二手市场入口）
   ============================================================ */

/** 限时种子：偶尔开放玩家等级买不到的种子（每天刷新，2~3 种） */
function getLimitedSeeds() {
    if (!gameState.mallLimitedSeeds || gameState.mallLimitedSeeds.day !== gameState.day) {
        const higher = (typeof CROPS_ALL !== 'undefined' ? CROPS_ALL : [])
            .filter((c) => c.unlockLevel > gameState.level && c.unlockLevel <= gameState.level + 15);
        const picked = [];
        const tmp = higher.slice();
        const want = Math.min(3, tmp.length);
        for (let i = 0; i < want; i++) {
            const idx = Math.floor(Math.random() * tmp.length);
            picked.push({ cropId: tmp[idx].id, unlockLevel: tmp[idx].unlockLevel });
            tmp.splice(idx, 1);
        }
        gameState.mallLimitedSeeds = { day: gameState.day, list: picked };
        markDirty();
    }
    return (gameState.mallLimitedSeeds.list || []).map((entry) => {
        const c = (typeof getCropById === 'function') ? getCropById(entry.cropId) : null;
        if (!c) return null;
        return {
            kind: 'limitedSeed',
            cropId: c.id,
            name: c.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子'),
            display: c.icon + ' ' + c.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子'),
            icon: c.icon,
            price: Math.max(1, Math.floor(c.price * 3)),   /* 限时溢价 3 倍 */
            unlockLevel: c.unlockLevel,
        };
    }).filter(Boolean);
}

/** 其他商城可买的辅助用品（肥料 / 加速道具） */
function getSupportGoods() {
    const goods = [];
    if (typeof FERTILIZERS !== 'undefined') {
        for (const fert of FERTILIZERS) {
            if ((fert.unlockLevel || 1) > gameState.level) continue;
            goods.push({
                kind: 'fertilizer',
                key: 'buy_fert_' + fert.id,
                name: fert.name,
                display: fert.icon + ' ' + fert.name,
                icon: fert.icon,
                desc: fert.description || '',
                price: fert.price || 50,
                fertId: fert.id,
            });
        }
    }
    return goods;
}

/** 购买辅助用品 / 限时种子 */
function buySupportGood(good) {
    if (!good) return { ok: false };
    if (gameState.gold < good.price) return { ok: false, reason: t('trade.errGold') };
    spendGold(good.price);

    if (good.kind === 'fertilizer') {
        addToStorage(good.name, 1, 1, { category: 'fertilizer', icon: good.icon });
    } else if (good.kind === 'limitedSeed') {
        if (typeof addSeedCount === 'function') addSeedCount(good.cropId, 1);
        addToStorage(good.name, 1, 1, { category: 'seed', icon: '🌱', sellPrice: 1, cropId: good.cropId });
    }
    markDirty();
    return { ok: true };
}
