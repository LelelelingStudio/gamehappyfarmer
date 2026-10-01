/* ============================================================
   achievementSystem.js  —  150 个成就
   版本：v1.0.1
   ============================================================ */

/* -------- 初始化统计容器 -------- */
function initAchievements() {
    if (!gameState.achievements) gameState.achievements = { unlocked: {} };
    if (!gameState.achievements.unlocked) gameState.achievements.unlocked = {};

    /* 确保 stats 存在 */
    const s = gameState.stats;
    s.plantCount     = s.plantCount     || 0;
    s.waterCount     = s.waterCount     || 0;
    s.tillCount      = s.tillCount      || 0;
    s.harvestCount   = s.harvestCount   || 0;
    s.cropHarvestMap = s.cropHarvestMap || {};  // { cropName: count }
    s.categoryHarvest= s.categoryHarvest|| {};  // { category: count }
    s.factoryRun     = s.factoryRun     || 0;
    s.productCollect = s.productCollect || {};
    s.itemSold       = s.itemSold       || 0;
    s.merchantTrade  = s.merchantTrade  || 0;
    s.merchantTradeWith = s.merchantTradeWith || {};
    s.consignmentSold= s.consignmentSold|| 0;
    s.auctionWin     = s.auctionWin     || 0;
    s.skinUsed       = s.skinUsed       || {};
    s.expTotal       = s.expTotal       || 0;
    s.landOwned      = s.landOwned      || 0;
    s.dayReached     = s.dayReached     || 1;
    s.seasonSeen     = s.seasonSeen     || {};
    s.weatherSeen    = s.weatherSeen    || {};
    s.specialStats   = s.specialStats   || {};  // 各种特殊统计
}

/* -------- 记录各种事件（供各系统调用） -------- */
function recordStat(key, value = 1, subKey = null) {
    initAchievements();
    const s = gameState.stats;

    if (subKey) {
        if (!s[key]) s[key] = {};
        if (typeof value === 'object') {
            s[key][subKey] = value;
        } else {
            s[key][subKey] = (s[key][subKey] || 0) + value;
        }
    } else {
        s[key] = (s[key] || 0) + value;
    }
    markDirty();
}

/* -------- 检查条件是否达成 -------- */
function checkAchievementCondition(ach) {
    const s = gameState.stats;
    const cond = ach.condition;
    const param = ach.conditionParam;

    switch (cond) {
        case 'plantCount':          return (s.plantCount || 0) >= param;
        case 'waterCount':          return (s.waterCount || 0) >= param;
        case 'tillCount':           return (s.tillCount || 0) >= param;
        case 'harvestCount':        return (s.harvestCount || 0) >= param;
        case 'goldEarned':          return s.totalGoldEarned >= param;
        case 'goldSpent':           return s.totalGoldSpent >= param;
        case 'goldHeld':            return gameState.gold >= param;
        case 'levelReached':        return gameState.level >= param;
        case 'expTotal':            return s.expTotal >= param;
        case 'factoryRun':          return (s.factoryRun || 0) >= param;
        case 'itemSold':            return (s.itemSold || 0) >= param;
        case 'merchantTrade':       return (s.merchantTrade || 0) >= param;
        case 'consignmentSold':     return (s.consignmentSold || 0) >= param;
        case 'auctionWin':          return (s.auctionWin || 0) >= param;
        case 'landOwned':           return gameState.ownedPlots >= param;
        case 'dayReached':          return gameState.day >= param;
        case 'seasonSeen':          return Object.keys(s.seasonSeen || {}).length >= param;
        case 'weatherSeen':         return Object.keys(s.weatherSeen || {}).length >= param;

        case 'cropHarvest': {
            const name = param.name;
            const need = param.count;
            return ((s.cropHarvestMap || {})[name] || 0) >= need;
        }

        case 'categoryHarvest': {
            const cat = param.category;
            const need = param.count;
            return ((s.categoryHarvest || {})[cat] || 0) >= need;
        }

        case 'cropCollect': {
            const need = param;
            const have = Object.keys(s.cropHarvestMap || {}).length;
            return have >= need;
        }

        case 'productCollect': {
            const need = param;
            const have = Object.keys(s.productCollect || {}).length;
            return have >= need;
        }

        case 'skinUsed': {
            const need = param;
            const have = Object.keys(s.skinUsed || {}).length;
            return have >= need;
        }

        case 'merchantTradeWith': {
            return !!((s.merchantTradeWith || {})[param]);
        }

        /* special: 特殊条件 */
        default:
            if (typeof cond === 'string' && cond.startsWith('special:')) {
                const key = cond.substring(8);
                return checkSpecialAchievement(key, param);
            }
            return false;
    }
}

/* -------- 特殊成就判定 -------- */
function checkSpecialAchievement(key, param) {
    const s = gameState.stats;
    const ss = s.specialStats || {};

    switch (key) {
        case 'greenhouse30':         return (ss.greenhouseDays || 0) >= param;
        case 'water100in1day':       return (ss.maxWaterInDay || 0) >= param;
        case 'fertilizer100':        return (ss.fertilizerUsed || 0) >= param;
        case 'plantStreak7':         return (ss.plantStreak || 0) >= param;
        case 'earnBig':              return (ss.maxSingleEarn || 0) >= param;
        case 'merchantBig':          return (ss.maxMerchantTrade || 0) >= param;
        case 'allMerchants':         return Object.keys(s.merchantTradeWith || {}).length >= param;
        case 'goodEvents':           return (ss.goodEvents || 0) >= param;
        case 'badEvents':            return (ss.badEvents || 0) >= param;
        case 'stormHarvest':         return (ss.stormHarvest || 0) >= param;
        case 'harvest100in1day':     return (ss.maxHarvestInDay || 0) >= param;
        case 'harvestStreak10':      return (ss.harvestStreak || 0) >= param;
        case 'water50':              return (ss.maxWaterInDay || 0) >= param;
        case 'mallBig':              return (ss.maxMallSpend || 0) >= param;
        case 'noSeeds':              return false;  // 需要额外检查
        case 'zeroGold':             return gameState.gold === 0;
        case 'storageFull':          return gameState.storageUsed >= gameState.storageCapacity;
        case 'useLegendaryFertilizer': return (ss.legendaryFertilizerUsed || 0) >= 1;
        case 'allFertilizers':       return (ss.fertilizerTypes || 0) >= param;
        case 'lazyDay':              return false;  // 一天没种植
        case 'nightOwl':             return false;  // 需检查时间
        case 'earlyBird':            return false;
        case 'usePlantDoctor':       return (ss.plantDoctorUsed || 0) >= param;
        case 'digCrops':             return (ss.digCrops || 0) >= param;
        case 'lostGold':             return (ss.lostGold || 0) >= param;
        case 'lowGold':              return gameState.gold < param;
        case 'almostLevel':          return false;
        case 'allCategories':        return false;
        case 'allNonHidden':         return false;
        default:                     return false;
    }
}

/* -------- 检查所有成就 -------- */
function checkAchievements() {
    initAchievements();

    const unlocked = gameState.achievements.unlocked;
    const newlyUnlocked = [];

    for (const ach of ACHIEVEMENTS) {
        if (unlocked[ach.id]) continue;
        if (checkAchievementCondition(ach)) {
            unlocked[ach.id] = {
                unlockedAt: Date.now(),
                day: gameState.day,
            };
            newlyUnlocked.push(ach);
        }
    }

    if (newlyUnlocked.length > 0) {
        markDirty();
        for (const ach of newlyUnlocked) {
            eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, ach);
            if (typeof playSfx === 'function') playSfx('achievement');
            if (typeof showNotification === 'function') {
                showNotification(t('achievement.unlockedTitle'), `${ach.icon} ${ach.name}`, 'success');
            }
        }
    }
    return newlyUnlocked;
}

/* -------- 统计查询 -------- */
function getAchievementProgress() {
    initAchievements();
    const total = ACHIEVEMENTS.length;
    const unlocked = Object.keys(gameState.achievements.unlocked).length;
    return { total, unlocked, percent: Math.round(unlocked / total * 100) };
}

function isAchievementUnlocked(id) {
    initAchievements();
    return !!gameState.achievements.unlocked[id];
}

/* -------- 按条件分类获取成就列表（UI 用） -------- */
function getAchievementsByTab(tab) {
    initAchievements();
    const unlocked = gameState.achievements.unlocked;
    if (tab === 'unlocked') {
        return ACHIEVEMENTS.filter(a => unlocked[a.id]);
    }
    if (tab === 'locked') {
        return ACHIEVEMENTS.filter(a => !unlocked[a.id] && !a.hidden);
    }
    return ACHIEVEMENTS;
}