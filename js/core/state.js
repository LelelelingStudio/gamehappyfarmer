/* ============================================================
   state.js  —  游戏全局状态
   版本：v1.0.3
   ============================================================ */

const gameState = {

    /* -------- 基础数值 -------- */
    gold: INITIAL_GOLD,
    level: INITIAL_LEVEL,
    exp: INITIAL_EXP,
    expToNextLevel: EXP_BASE,
    day: INITIAL_DAY,

    /* -------- 土地 -------- */
    ownedPlots: INITIAL_OWNED_PLOTS,
    plots: {},
    landPriceIndex: 0,

    /* -------- 仓库 -------- */
    inventory: {},
    storageCapacity: INITIAL_STORAGE,
    storageUsed: 0,

    /* -------- 种子库存 -------- */
    seeds: {},
    selectedCrop: null,

    /* -------- 天气 / 季节 -------- */
    weather: '晴朗',
    nextWeather: '晴朗',
    season: '春季',
    seasonDay: 1,

    /* -------- 道具效果 -------- */
    activeEffects: {
        goldenWateringCan: false,
        scarecrow: false,
        greenhouse: false,
        irrigationSystem: false,
        blessingOfHarvest: false,
        seedMultiplier: 1,
        factoryBoost: false,
        merchantBoost: 0,          // 商人收购价加成（0.05 = +5%）
        landDiscount: 0,           // 开垦土地折扣
        mallDiscount: 0,           // 商城折扣
        autoWater: false,          // 自动浇水
        autoHarvest: false,        // 自动收获
        autoPlant: false,          // 自动种植
        doubleXP: false,           // 双倍经验
        doubleGold: false,         // 双倍金币
        eventShield: false,        // 事件护盾
        greenhousePermanent: false,
        scarecrowPermanent: false,
    },

    /* -------- 商城道具状态 -------- */
    mallItems: {},

    /* -------- 加工厂 -------- */
    processingItems: [],         // [{ productId, startDay, totalDays, quantity, level }]
    completedItems: [],          // [{ productId, completedDay, quantity, level }]

    /* -------- 商人 -------- */
    merchant: {
        present: false,
        nextVisit: 5,
        daysRemaining: 0,
        currentMerchantId: null,
        priceMultiplier: 1.0,
        lastMerchantId: null,
    },

    /* -------- 寄卖 -------- */
    consignments: [],

    /* -------- 拍卖 -------- */
    auction: {
        lastHeldDay: -999,
        active: null,
    },

    /* -------- 货币兑换历史 -------- */
    currencyHistory: [],

    /* -------- 货币（除铜板外的 4 级；铜板 = gold）-------- */
    currencies: {
        copperCoin: 0,
        silver:     0,
        goldCoin:   0,
        diamond:    0,
    },

    /* -------- 皮肤 -------- */
    unlockedSkins: ['default'],
    currentSkin: 'default',

    /* -------- 成就 -------- */
    achievements: { unlocked: {} },

    /* -------- 任务 -------- */
    dailyQuests: [],
    lastQuestResetDay: 0,

    /* -------- 用户 -------- */
    user: {
        nickname: '农场主',
        userId: null,
        avatar: null,
    },

    /* -------- 统计数据 -------- */
    stats: {
        /* --- 基础 --- */
        totalHarvests: 0,
        totalGoldEarned: 0,
        totalGoldSpent: 0,
        totalItemsSold: 0,
        totalFactoriesRun: 0,
        totalConsignmentsSold: 0,
        totalAuctionsWon: 0,
        consecutiveLoginDays: 0,
        lastLoginDay: 0,
        firstPlayedAt: 0,

        /* --- 成就系统计数 --- */
        plantCount: 0,
        waterCount: 0,
        tillCount: 0,
        harvestCount: 0,
        factoryRun: 0,
        itemSold: 0,
        merchantTrade: 0,
        consignmentSold: 0,
        auctionWin: 0,
        expTotal: 0,
        dayReached: 1,

        /* --- 成就系统映射 --- */
        cropHarvestMap: {},       // { cropName: count }
        categoryHarvest: {},      // { category: count }
        productCollect: {},       // { productId: true }
        merchantTradeWith: {},    // { merchantId: true }
        skinUsed: {},             // { skinId: true }
        seasonSeen: {},           // { seasonName: true }
        weatherSeen: {},          // { weatherName: true }

        /* --- 特殊统计 --- */
        specialStats: {
            greenhouseDays: 0,
            maxWaterInDay: 0,
            fertilizerUsed: 0,
            fertilizerTypes: 0,
            plantStreak: 0,
            harvestStreak: 0,
            maxSingleEarn: 0,
            maxMerchantTrade: 0,
            maxHarvestInDay: 0,
            maxMallSpend: 0,
            goodEvents: 0,
            badEvents: 0,
            stormHarvest: 0,
            plantDoctorUsed: 0,
            digCrops: 0,
            lostGold: 0,
            legendaryFertilizerUsed: 0,
        },
    },

    /* -------- 系统 -------- */
    nextDayReadyAt: 0,
    nextDayCooldownSec: 0,
    eventFrequency: EVENT_FREQUENCY_DEFAULT,
    lastTheftDay: 0,
    paused: false,

    /* -------- UI 状态 -------- */
    factoryLevelFilter: null,
    factorySearchQuery: '',
    mallCategoryFilter: 'low',
    mallPriceFluctuation: {},
    layoutMode: 'auto',

    /* -------- 设置 -------- */
    settings: {
        tickerPosition: 'top-right',
        tickerSound: true,
        effectsEnabled: true,
        browserNotify: false,
        autoSaveInterval: 30000,
        theme: 'light',
        displayMode: 'auto',
        language: 'auto',
        currencyDisplay: 'multi',
        bgmEnabled: true,
        bgmVolume: BGM_VOLUME_DEFAULT,
        sfxVolume: SFX_VOLUME_DEFAULT,
    },

    /* -------- 新手引导 -------- */
    guideSeen: false,
    rulesSeen: false,
    dynamicGuidesSeen: {},

    /* -------- 内部标记 -------- */
    _dirty: false,
    _lastSavedAt: 0,

    /* -------- 存档版本 -------- */
    saveVersion: '1.0.3',
};

/* ============================================================
   新游戏时重置为初始值
   ============================================================ */
function resetGameState() {

    gameState.gold = INITIAL_GOLD;
    gameState.level = INITIAL_LEVEL;
    gameState.exp = INITIAL_EXP;
    gameState.expToNextLevel = EXP_BASE;
    gameState.day = INITIAL_DAY;

    gameState.ownedPlots = INITIAL_OWNED_PLOTS;
    gameState.plots = {};
    gameState.landPriceIndex = 0;

    for (let i = 0; i < INITIAL_TILLED_PLOTS; i++) {
        gameState.plots[i] = { state: 'tilled', tilled: true };
    }

    gameState.inventory = {};
    gameState.storageCapacity = INITIAL_STORAGE;
    gameState.storageUsed = 0;

    gameState.seeds = {};
    gameState.selectedCrop = null;

    gameState.weather = '晴朗';
    gameState.nextWeather = '晴朗';
    gameState.season = '春季';
    gameState.seasonDay = 1;

    gameState.activeEffects = {
        goldenWateringCan: false,
        scarecrow: false,
        greenhouse: false,
        irrigationSystem: false,
        blessingOfHarvest: false,
        seedMultiplier: 1,
        factoryBoost: false,
        merchantBoost: 0,
        landDiscount: 0,
        mallDiscount: 0,
        autoWater: false,
        autoHarvest: false,
        autoPlant: false,
        doubleXP: false,
        doubleGold: false,
        eventShield: false,
        greenhousePermanent: false,
        scarecrowPermanent: false,
    };

    gameState.mallItems = {};
    gameState.processingItems = [];
    gameState.completedItems = [];

    gameState.merchant = {
        present: false,
        nextVisit: randInt(MERCHANT_VISIT_EARLY_MIN, MERCHANT_VISIT_EARLY_MAX),
        daysRemaining: 0,
        currentMerchantId: null,
        priceMultiplier: 1.0,
        lastMerchantId: null,
    };

    gameState.consignments = [];
    gameState.auction = { lastHeldDay: -999, active: null };
    gameState.currencyHistory = [];

    gameState.currencies = {
        copperCoin: 0,
        silver:     0,
        goldCoin:   0,
        diamond:    0,
    };

    gameState.unlockedSkins = ['default'];
    gameState.currentSkin = 'default';

    gameState.achievements = { unlocked: {} };
    gameState.dailyQuests = [];
    gameState.lastQuestResetDay = 0;

    gameState.user = {
        nickname: '农场主',
        userId: uid('user'),
    };

    gameState.stats = {
        /* --- 基础 --- */
        totalHarvests: 0,
        totalGoldEarned: 0,
        totalGoldSpent: 0,
        totalItemsSold: 0,
        totalFactoriesRun: 0,
        totalConsignmentsSold: 0,
        totalAuctionsWon: 0,
        consecutiveLoginDays: 0,
        lastLoginDay: 0,
        firstPlayedAt: Date.now(),

        /* --- 成就系统计数 --- */
        plantCount: 0,
        waterCount: 0,
        tillCount: 0,
        harvestCount: 0,
        factoryRun: 0,
        itemSold: 0,
        merchantTrade: 0,
        consignmentSold: 0,
        auctionWin: 0,
        expTotal: 0,
        dayReached: 1,

        /* --- 成就系统映射 --- */
        cropHarvestMap: {},
        categoryHarvest: {},
        productCollect: {},
        merchantTradeWith: {},
        skinUsed: {},
        seasonSeen: {},
        weatherSeen: {},

        /* --- 特殊统计 --- */
        specialStats: {
            greenhouseDays: 0,
            maxWaterInDay: 0,
            fertilizerUsed: 0,
            fertilizerTypes: 0,
            plantStreak: 0,
            harvestStreak: 0,
            maxSingleEarn: 0,
            maxMerchantTrade: 0,
            maxHarvestInDay: 0,
            maxMallSpend: 0,
            goodEvents: 0,
            badEvents: 0,
            stormHarvest: 0,
            plantDoctorUsed: 0,
            digCrops: 0,
            lostGold: 0,
            legendaryFertilizerUsed: 0,
        },
    };

    gameState.nextDayReadyAt = 0;
    gameState.nextDayCooldownSec = 0;
    gameState.eventFrequency = EVENT_FREQUENCY_DEFAULT;
    gameState.lastTheftDay = 0;
    gameState.paused = false;

    gameState.factoryLevelFilter = null;
    gameState.factorySearchQuery = '';
    gameState.mallCategoryFilter = 'low';
    gameState.mallPriceFluctuation = {};
    gameState.layoutMode = 'auto';

    gameState.settings = {
        tickerPosition: 'top-right',
        tickerSound: true,
        effectsEnabled: true,
        browserNotify: false,
        autoSaveInterval: 30000,
        theme: 'light',
        displayMode: 'auto',
        language: 'auto',
        currencyDisplay: 'multi',
        bgmEnabled: true,
        bgmVolume: BGM_VOLUME_DEFAULT,
        sfxVolume: SFX_VOLUME_DEFAULT,
    };

    gameState.guideSeen = false;
    gameState.rulesSeen = false;
    gameState.dynamicGuidesSeen = {};

    gameState._dirty = false;
    gameState._lastSavedAt = 0;
    gameState.saveVersion = '1.0.3';
}

/* ============================================================
   地块访问辅助
   ============================================================ */

function getPlot(plotId) {
    if (gameState.plots[plotId]) return gameState.plots[plotId];
    if (plotId < gameState.ownedPlots) return { state: 'empty', tilled: false };
    return { state: 'locked', tilled: false };
}

function setPlot(plotId, patch) {
    const current = gameState.plots[plotId] || {};
    gameState.plots[plotId] = { ...current, ...patch };
}

function clearPlot(plotId) {
    delete gameState.plots[plotId];
}

/* ============================================================
   标记有改动
   ============================================================ */
function markDirty() {
    gameState._dirty = true;
}