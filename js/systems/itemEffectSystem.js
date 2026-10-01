/* ============================================================
   itemEffectSystem.js  —  商城道具 / 消耗品效果
   ------------------------------------------------------------
   商城有 39 种 effect（金币、经验、永久增益、限时增益、消耗品、
   即时操作）。此前只有 gainGold / gainExp 生效，其余道具买完即入库
   且没有任何作用。这里集中实现，并由 mallUI / 各系统调用。

   限时效果统一记在 gameState.activeEffects._timed[flag] = 剩余天数，
   由 tickTimedFlags() 在每天推进时递减（见 eventSystem.checkTimedEffects）。
   ============================================================ */

/* 限时开关型效果：effect 名 → activeEffects 中的标记名 */
const TIMED_FLAG_EFFECTS = {
    scarecrow:         'scarecrow',
    greenhouse:        'greenhouse',
    irrigationSystem:  'irrigationSystem',
    doubleXP:          'doubleXP',
    doubleGold:        'doubleGold',
    factoryBoost:      'factoryBoost',
    blessingOfHarvest: 'blessingOfHarvest',
    eventShield:       'eventShield',
    weatherControl:    'weatherControl',
    merchantVisit:     'merchantVisit',
};

/* 永久累加型增益：effect 名 → activeEffects 中的字段 */
const PERCENT_BOOST_EFFECTS = ['xpBoost', 'goldBoost', 'luckBoost', 'landDiscount', 'mallDiscount', 'merchantBoost'];

/* -------- 内部工具 -------- */

function _fxSetTimedFlag(flag, days) {
    const eff = gameState.activeEffects;
    eff[flag] = true;
    const d = Number(days) || 0;
    if (d > 0) {
        eff._timed = eff._timed || {};
        eff._timed[flag] = (eff._timed[flag] || 0) + d;
    }
    return eff;
}

function _fxAddPercent(flag, percent) {
    const eff = gameState.activeEffects;
    const value = Number(percent) || 0;
    eff[flag] = (Number(eff[flag]) || 0) + value;
    return eff[flag];
}

/* 每天递减限时效果（由 checkTimedEffects 调用） */
function tickTimedFlags() {
    const eff = gameState.activeEffects;
    if (!eff || !eff._timed) return;
    for (const flag of Object.keys(eff._timed)) {
        eff._timed[flag] = (Number(eff._timed[flag]) || 0) - 1;
        if (eff._timed[flag] <= 0) {
            delete eff._timed[flag];
            if (flag === 'merchantVisit') continue;   /* 商人到访不是开关，不强制关闭 */
            eff[flag] = false;
        }
    }
}

/* 限时效果剩余天数（用于 UI 文案），0 表示永久或未启用 */
function getTimedEffectDays(flag) {
    const eff = gameState.activeEffects;
    if (!eff || !eff._timed) return 0;
    return Number(eff._timed[flag]) || 0;
}

/* 所有正在生效的增益摘要（设置面板/调试用） */
function getActiveEffectSummary() {
    const eff = gameState.activeEffects || {};
    const rows = [];
    for (const flag of Object.keys(TIMED_FLAG_EFFECTS).map((k) => TIMED_FLAG_EFFECTS[k])) {
        if (eff[flag]) rows.push({ flag, days: getTimedEffectDays(flag) });
    }
    for (const flag of PERCENT_BOOST_EFFECTS) {
        if (eff[flag]) rows.push({ flag, percent: eff[flag] });
    }
    if (eff.seedMultiplier > 1) rows.push({ flag: 'seedMultiplier', value: eff.seedMultiplier });
    return rows;
}

/* -------- 商城折后价（mallDiscount 生效） -------- */
function getMallEffectivePrice(item) {
    if (!item) return 0;
    const discount = Number(gameState.activeEffects.mallDiscount) || 0;
    return Math.max(1, Math.round(item.price * (1 - Math.min(0.9, discount))));
}

/* -------- 即时类效果的小工具 -------- */

function _fxGiveRandomItem(count) {
    const pool = (typeof CROPS_ALL !== 'undefined')
        ? CROPS_ALL.filter((c) => c.unlockLevel <= gameState.level)
        : [];
    if (pool.length === 0) return null;
    const crop = pool[Math.floor(Math.random() * pool.length)];
    const n = Math.max(1, Number(count) || 1);
    addToStorage(crop.name, n, 1, { category: crop.category, icon: crop.icon, sellPrice: crop.sellPrice });
    return { name: crop.name, icon: crop.icon, count: n };
}

function _fxGiveSeeds(cropName, count) {
    if (typeof getCropByName === 'function') {
        const crop = getCropByName(cropName);
        if (crop) {
            if (typeof addSeedCount === 'function') addSeedCount(crop.id, count);
            const suffix = (typeof SEED_NAME_SUFFIX !== 'undefined') ? SEED_NAME_SUFFIX : '种子';
            addToStorage(crop.name + suffix, count, 1, { category: 'seed', icon: '🌱', sellPrice: 1, cropId: crop.id });
            return { name: crop.name, count };
        }
    }
    /* 找不到指定作物时退化为随机种子 */
    const pool = (typeof CROPS_ALL !== 'undefined') ? CROPS_ALL.filter((c) => c.unlockLevel <= gameState.level) : [];
    if (pool.length === 0) return null;
    const crop = pool[Math.floor(Math.random() * pool.length)];
    if (typeof addSeedCount === 'function') addSeedCount(crop.id, count);
    const suffix = (typeof SEED_NAME_SUFFIX !== 'undefined') ? SEED_NAME_SUFFIX : '种子';
    addToStorage(crop.name + suffix, count, 1, { category: 'seed', icon: '🌱', sellPrice: 1, cropId: crop.id });
    return { name: crop.name, count };
}

/**
 * 应用一个商城道具的效果。
 * @returns {{ok:boolean, key?:string, params?:object}}
 *   key/params 供 UI 用 t(key, params) 显示反馈。
 */
function applyMallItemEffect(item) {
    if (!item) return { ok: false };
    const eff = gameState.activeEffects;
    const p = item.effectParam || {};
    const dur = Number(item.duration) || 0;
    const done = (key, params) => ({ ok: true, key, params: params || {} });

    switch (item.effect) {
        /* ---------- 货币 / 经验 ---------- */
        case 'gainGold': {
            const amount = Number(p.amount) || 100;
            addGold(amount);
            return done('mall.fxGold', { amount: formatNumber(amount) });
        }
        case 'gainExp': {
            const amount = Number(p.amount) || 50;
            addExp(amount);
            return done('mall.fxExp', { amount: formatNumber(amount) });
        }

        /* ---------- 种子 / 随机物品 / 肥料 ---------- */
        case 'gainSeeds': {
            const got = _fxGiveSeeds(p.cropName, Number(p.count) || 10);
            if (!got) return { ok: false };
            return done('mall.fxSeeds', { name: got.name, count: got.count });
        }
        case 'gainRandomItem': {
            const got = _fxGiveRandomItem(p.count);
            if (!got) return { ok: false };
            return done('mall.fxRandom', { name: got.name, count: got.count });
        }
        case 'fertilizer_normal':
        case 'fertilizer_advanced':
        case 'fertilizer_organic':
        case 'fertilizer_magic':
        case 'fertilizer_legendary': {
            const fert = (typeof FERTILIZERS !== 'undefined')
                ? FERTILIZERS.find((f) => f.id === item.effect)
                : null;
            const name = fert ? fert.name : item.name;
            addToStorage(name, 1, 1, { category: 'fertilizer', icon: fert ? fert.icon : '🧪' });
            return done('mall.fxFertilizer', { name });
        }

        /* ---------- 永久数值增益 ---------- */
        case 'storageBoost': {
            const amount = Number(p.amount) || 10;
            gameState.storageCapacity += amount;
            updateStorageUsage();
            return done('mall.fxStorage', { amount });
        }
        case 'seedMultiplier': {
            const mult = Number(p.multiplier) || 2;
            eff.seedMultiplier = Math.max(Number(eff.seedMultiplier) || 1, mult);
            return done('mall.fxSeedMultiplier', { mult: eff.seedMultiplier });
        }
        case 'xpBoost':
        case 'goldBoost':
        case 'luckBoost':
        case 'landDiscount':
        case 'mallDiscount':
        case 'merchantBoost': {
            const percent = Number(p.percent) || 0.05;
            const total = _fxAddPercent(item.effect, percent);
            return done('mall.fxBoost', { effect: t('mall.effectName.' + item.effect), percent: Math.round(total * 100) });
        }

        /* ---------- 永久开关 ---------- */
        case 'goldenWateringCan':
        case 'autoWater':
        case 'autoHarvest':
        case 'autoPlant': {
            eff[item.effect] = true;
            return done('mall.fxPermanent', { name: item.name });
        }
        case 'scarecrowPermanent':
            eff.scarecrow = true;
            eff.scarecrowPermanent = true;
            delete eff.scarecrowDaysLeft;
            return done('mall.fxPermanent', { name: item.name });
        case 'greenhousePermanent':
            eff.greenhouse = true;
            eff.greenhousePermanent = true;
            delete eff.greenhouseDaysLeft;
            return done('mall.fxPermanent', { name: item.name });
        case 'scarecrow':
            eff.scarecrowPermanent = false;
            eff.scarecrow = true;
            eff.scarecrowDaysLeft = (Number(eff.scarecrowDaysLeft) || 0) + (dur || 30);
            return done('mall.fxTimed', { name: item.name, days: eff.scarecrowDaysLeft });
        case 'greenhouse':
            eff.greenhousePermanent = false;
            eff.greenhouse = true;
            eff.greenhouseDaysLeft = (Number(eff.greenhouseDaysLeft) || 0) + (dur || 50);
            return done('mall.fxTimed', { name: item.name, days: eff.greenhouseDaysLeft });

        /* ---------- 限时开关 ---------- */
        case 'irrigationSystem':
        case 'doubleXP':
        case 'doubleGold':
        case 'factoryBoost':
        case 'blessingOfHarvest':
        case 'eventShield':
            _fxSetTimedFlag(TIMED_FLAG_EFFECTS[item.effect], dur || 7);
            return done('mall.fxTimed', { name: item.name, days: dur || 7 });

        /* ---------- 天气 ---------- */
        case 'resetWeather':
        case 'weatherControl': {
            const good = (typeof SEASONS !== 'undefined') ? '晴朗' : '晴朗';
            gameState.weather = good;
            gameState.nextWeather = good;
            if (item.effect === 'weatherControl') {
                _fxSetTimedFlag('weatherControl', dur || 10);
                return done('mall.fxTimed', { name: item.name, days: dur || 10 });
            }
            return done('mall.fxWeather');
        }

        /* ---------- 商人 ---------- */
        case 'merchantVisit': {
            const m = gameState.merchant;
            const days = Math.max(3, dur || 3);
            if (!m.present) {
                const merchant = (typeof pickRandomMerchant === 'function') ? pickRandomMerchant(m.lastMerchantId) : null;
                if (merchant) {
                    m.present = true;
                    m.currentMerchantId = merchant.id;
                    m.lastMerchantId = merchant.id;
                }
            }
            m.daysRemaining = Math.max(Number(m.daysRemaining) || 0, days);
            _fxSetTimedFlag('merchantVisit', days);
            return done('mall.fxMerchant', { days });
        }

        /* ---------- 即时操作 ---------- */
        case 'skipCooldown': {
            gameState.nextDayReadyAt = 0;
            gameState._nextDayReadyNotified = false;
            return done('mall.fxCooldown');
        }
        case 'rerollEvents': {
            if (typeof rerollEvents === 'function') rerollEvents();
            else gameState.lastEventDay = -1;
            return done('mall.fxReroll');
        }
        case 'instantGrow':
        case 'instantGrowAll': {
            let count = 0;
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const plot = getPlot(i);
                if (plot.state !== 'planted') continue;
                const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
                if (!crop) continue;
                if (plot.growthProgress < crop.growthTime) {
                    setPlot(i, { growthProgress: crop.growthTime, watered: true });
                    count++;
                    if (item.effect === 'instantGrow') break;
                }
            }
            if (count === 0) return { ok: false, key: 'mall.fxNothingGrowing' };
            return done('mall.fxGrow', { count });
        }
        case 'cureAll': {
            let count = 0;
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const plot = getPlot(i);
                if (plot.state === 'sick') { setPlot(i, { state: 'planted' }); count++; }
            }
            return done('mall.fxCure', { count });
        }
        case 'clearRocks': {
            /* 本作没有石头地块：改为把所有空地翻好土，效果等价且不浪费道具 */
            let count = 0;
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const plot = getPlot(i);
                if (plot.state === 'empty' && !plot.tilled) { setPlot(i, { state: 'tilled', tilled: true }); count++; }
            }
            return done('mall.fxClear', { count });
        }

        default: {
            const flag = TIMED_FLAG_EFFECTS[item.effect];
            if (flag) {
                _fxSetTimedFlag(flag, dur || 7);
                return done('mall.fxTimed', { name: item.name, days: dur || 7 });
            }
            return { ok: false, key: 'mall.fxUnknown' };
        }
    }
}
