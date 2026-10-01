/* ============================================================
   eventSystem.js  —  随机事件
   版本：v1.0.1
   ============================================================ */

/* -------- 检查事件条件 -------- */
function checkEventCondition(event) {
    const cond = event.condition;
    const param = event.conditionParam;

    switch (cond) {
        case null:
        case undefined:
            return true;

        case 'notScarecrow':
            /* 稻草人 或 事件护盾 都能挡下小偷 */
            return !gameState.activeEffects.scarecrow && !gameState.activeEffects.eventShield;

        case 'hasPlanted': {
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const p = getPlot(i);
                if (p.state === 'planted' || p.state === 'sick') return true;
            }
            return false;
        }

        case 'hasMature': {
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const p = getPlot(i);
                if (p.state !== 'planted') continue;
                const c = (typeof getCropById === 'function') ? getCropById(p.cropId) : null;
                if (c && p.growthProgress >= c.growthTime) return true;
            }
            return false;
        }

        case 'hasInventory':
            return Object.keys(gameState.inventory).length > 0;

        case 'goldOver':
            return gameState.gold >= (param || 0);

        case 'dayOver':
            return gameState.day >= (param || 0);

        case 'gapFromLastTheft':
            return (gameState.day - (gameState.lastTheftDay || 0)) >= (param || 3);

        case 'merchantNotPresent':
            return !gameState.merchant.present;

        default:
            return true;
    }
}

/* -------- 应用事件效果 -------- */
function applyEventEffect(event) {
    const eff = event.effect;
    const param = event.effectParam || {};

    switch (eff) {
        case 'gainGold': {
            addGold(param.amount || 100);
            break;
        }

        case 'gainGoldRandom': {
            const amount = randInt(param.min || 50, param.max || 200);
            addGold(amount);
            break;
        }

        case 'loseGoldPercent': {
            const lose = Math.floor(gameState.gold * (param.percent || 0.1));
            if (lose > 0) {
                spendGold(lose);
            }
            gameState.lastTheftDay = gameState.day;
            if (typeof notify !== 'undefined' && notify.theft) notify.theft(lose);
            break;
        }

        case 'sickenCrops': {
            const maxCount = param.maxCount || 3;
            const candidates = [];
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const p = getPlot(i);
                if (p.state !== 'planted') continue;
                if (param.matureOnly) {
                    const c = (typeof getCropById === 'function') ? getCropById(p.cropId) : null;
                    if (!c || p.growthProgress < c.growthTime) continue;
                }
                candidates.push(i);
            }
            /* 二手种子更脆弱：更容易被病害盯上 */
            const weak = candidates.filter((id) => getPlot(id).secondHand);
            const strong = candidates.filter((id) => !getPlot(id).secondHand);
            const ordered = shuffle(weak).concat(shuffle(strong));
            const picked = ordered.slice(0, Math.min(maxCount, ordered.length));
            picked.forEach(id => setPlot(id, { state: 'sick' }));
            if (picked.length > 0 && typeof notify !== 'undefined' && notify.cropsSick) notify.cropsSick(picked.length);
            break;
        }

        case '__never__': {
            const count = Math.min(maxCount, candidates.length);
            const picked = shuffle(candidates).slice(0, count);
            break;
        }

        case 'cureAll': {
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const p = getPlot(i);
                if (p.state === 'sick') setPlot(i, { state: 'planted' });
            }
            break;
        }

        case 'boostAllGrowth': {
            const days = param.days || 1;
            if (typeof growCrops === 'function') growCrops(days);
            break;
        }

        case 'waterAll': {
            for (let i = 0; i < gameState.ownedPlots; i++) {
                const p = getPlot(i);
                if (p.state === 'planted' || p.state === 'sick') {
                    setPlot(i, { watered: true });
                }
            }
            break;
        }

        case 'merchantEarly': {
            gameState.merchant.nextVisit = 0;
            if (typeof checkMerchant === 'function') checkMerchant();
            break;
        }

        case 'mallDiscount': {
            /* 商城折扣在 mallUI 里读取 mallPriceFluctuation 使用 */
            gameState.mallPriceFluctuation = {
                discount: param.percent || 0.2,
                daysLeft: param.days || 2,
            };
            break;
        }

        case 'freeItem': {
            const name = param.itemName;
            const count = param.count || 1;
            if (name && count > 0) {
                const crop = (typeof getCropByName === 'function') ? getCropByName(name) : null;
                if (crop) {
                    addToStorage(name, count, 1, {
                        category: crop.category,
                        icon: crop.icon,
                        sellPrice: crop.sellPrice,
                    });
                } else {
                    addToStorage(name, count, 1, {});
                }
            }
            break;
        }

        case 'blessingTemp': {
            gameState.activeEffects.blessingOfHarvest = true;
            gameState.activeEffects.blessingDaysLeft = param.days || 2;
            break;
        }

        default:
            break;
    }

    markDirty();
}

/* -------- 每天触发随机事件 -------- */
function rollRandomEvent() {
    /* 注意：频率 0 表示关闭随机事件，不能写成 `|| 1`（会把 0 变成 1） */
    const freq = (typeof gameState.eventFrequency === 'number') ? gameState.eventFrequency : EVENT_FREQUENCY_DEFAULT;
    if (freq <= 0) return [];
    const prob = EVENT_BASE_PROB * freq;

    /* 是否触发 */
    if (Math.random() > prob) return [];

    /* 抽 1~EVENT_MAX_PER_DAY 个 */
    const maxCount = EVENT_MAX_PER_DAY;
    const triggered = [];

    /* 先过滤出条件满足的事件池 */
    const pool = RANDOM_EVENTS.filter(e => checkEventCondition(e));
    if (pool.length === 0) return [];

    /* 幸运加成：正向事件更容易被抽到 */
    const luck = Number((gameState.activeEffects || {}).luckBoost) || 0;
    if (luck > 0) {
        for (const e of pool) {
            const base = e.weight || 1;
            if (e.type === 'success' || e.type === 'event') e.weight = base * (1 + luck);
            else e.weight = Math.max(0.2, base * (1 - luck * 0.5));
        }
    }

    const count = Math.min(maxCount, pool.length);

    for (let i = 0; i < count; i++) {
        /* 每个事件按权重抽取 */
        const total = pool.reduce((sum, e) => sum + (e.weight || 1), 0);
        let roll = Math.random() * total;
        let picked = pool[0];
        for (const e of pool) {
            roll -= (e.weight || 1);
            if (roll <= 0) { picked = e; break; }
        }

        applyEventEffect(picked);
        triggered.push(picked);

        /* 把已触发的事件从池中移除，避免同一天触发两次 */
        const idx = pool.indexOf(picked);
        if (idx >= 0) pool.splice(idx, 1);
        if (pool.length === 0) break;
    }

    if (triggered.length > 0) {
        eventBus.emit(EVENTS.RANDOM_EVENT, triggered);
    }
    return triggered;
}

/* -------- 建筑类效果：稻草人 / 温室 / 灌溉 -------- */
function checkTimedEffects() {
    const eff = gameState.activeEffects;

    /* 稻草人 */
    if (eff.scarecrow && eff.scarecrowDaysLeft !== undefined) {
        eff.scarecrowDaysLeft--;
        if (eff.scarecrowDaysLeft <= 0) {
            eff.scarecrow = false;
            eff.scarecrowDaysLeft = 0;
        }
    }

    /* 温室 */
    if (eff.greenhouse && eff.greenhouseDaysLeft !== undefined) {
        eff.greenhouseDaysLeft--;
        if (eff.greenhouseDaysLeft <= 0) {
            eff.greenhouse = false;
            eff.greenhouseDaysLeft = 0;
        }
    }

    /* 灌溉系统 */
    if (eff.irrigationSystem && eff.irrigationDaysLeft !== undefined) {
        eff.irrigationDaysLeft--;
        if (eff.irrigationDaysLeft <= 0) {
            eff.irrigationSystem = false;
            eff.irrigationDaysLeft = 0;
        }
    }

    /* 双倍经验 / 金币 */
    if (eff.doubleXP && eff.doubleXPDaysLeft !== undefined) {
        eff.doubleXPDaysLeft--;
        if (eff.doubleXPDaysLeft <= 0) eff.doubleXP = false;
    }
    if (eff.doubleGold && eff.doubleGoldDaysLeft !== undefined) {
        eff.doubleGoldDaysLeft--;
        if (eff.doubleGoldDaysLeft <= 0) eff.doubleGold = false;
    }

    /* 丰收祝福 */
    if (eff.blessingOfHarvest && eff.blessingDaysLeft !== undefined) {
        eff.blessingDaysLeft--;
        if (eff.blessingDaysLeft <= 0) eff.blessingOfHarvest = false;
    }

    /* 商城道具的限时效果统一在此递减 */
    if (typeof tickTimedFlags === 'function') tickTimedFlags();
}

/* -------- 立即重抽一次随机事件（商城「事件重抽」道具） -------- */
function rerollEvents() {
    if (typeof rollRandomEvent === 'function') rollRandomEvent();
    markDirty();
}