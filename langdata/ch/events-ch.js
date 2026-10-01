/* ============================================================
   events.js  —  随机事件表
   版本：v1.0.1

   设计原则：
     - 数据驱动：事件只描述"什么条件 + 什么效果"，不写逻辑
     - 逻辑在 eventSystem.js 里统一解释
     - 条件用字符串 + 参数，效果用字符串 + 参数

   字段说明：
     id            唯一标识
     name          事件名（用于日志）
     icon          图标（Emoji）
     message       显示给玩家的消息
     type          'success' | 'warning' | 'danger' | 'event'
     weight        抽取权重
     condition     触发条件（字符串），可为空表示无条件
     conditionParam 条件参数（数字等）
     effect        效果（字符串）
     effectParam   效果参数（对象）

   条件类型：
     'notScarecrow'        没有稻草人
     'hasPlanted'          至少有 1 块地在种
     'hasMature'           至少有 1 块地成熟
     'hasInventory'        仓库里有东西
     'goldOver'            金币 >= N
     'dayOver'             当前天数 >= N
     'gapFromLastTheft'    距上次小偷 >= N 天
     'merchantNotPresent'  商人当前不在场

   效果类型：
     'gainGold'            获得金币 {amount}
     'gainGoldRandom'      随机获得金币 {min, max}
     'loseGoldPercent'     失去 N% 金币 {percent}
     'sickenCrops'         让 N 块地作物生病 {maxCount}
     'cureAll'             治愈所有生病作物
     'boostAllGrowth'      所有作物生长 +N 天 {days}
     'waterAll'            自动给所有作物浇水
     'merchantEarly'       商人提前到访
     'mallDiscount'        商城打折 {percent, days}
     'freeItem'            免费获得物品 {itemName, count}
     'blessingTemp'        临时丰收祝福 {days}
   ============================================================ */

const RANDOM_EVENTS = [

    /* ============ 正面事件 ============ */

    {
        id: 'treasure',
        name: '宝箱掉落',
        icon: '🎁',
        message: '在田边发现了一个宝箱，获得了 100 金币！',
        type: 'success',
        weight: 15,
        condition: null,
        effect: 'gainGold',
        effectParam: { amount: 100 },
    },

    {
        id: 'luckyDay',
        name: '幸运日',
        icon: '🍀',
        message: '今天运气不错，意外捡到了一些钱！',
        type: 'success',
        weight: 12,
        condition: null,
        effect: 'gainGoldRandom',
        effectParam: { min: 50, max: 200 },
    },

    {
        id: 'sunshine',
        name: '阳光普照',
        icon: '☀️',
        message: '今天阳光特别充足，所有作物额外生长了 1 天！',
        type: 'success',
        weight: 14,
        condition: 'hasPlanted',
        effect: 'boostAllGrowth',
        effectParam: { days: 1 },
    },

    {
        id: 'rainBlessing',
        name: '甘霖降临',
        icon: '🌧️',
        message: '一场及时雨洒过农田，所有作物都喝饱了水！',
        type: 'success',
        weight: 10,
        condition: 'hasPlanted',
        effect: 'waterAll',
        effectParam: {},
    },

    {
        id: 'merchantEarly',
        name: '商人提前到访',
        icon: '🏃',
        message: '有一位商人提前赶来了，他说有紧急的生意！',
        type: 'event',
        weight: 8,
        condition: 'merchantNotPresent',
        effect: 'merchantEarly',
        effectParam: {},
    },

    {
        id: 'freeFertilizer',
        name: '肥料大放送',
        icon: '🌿',
        message: '路过的农夫送了你 3 袋普通肥料！',
        type: 'success',
        weight: 8,
        condition: null,
        effect: 'freeItem',
        effectParam: { itemName: '普通肥料', count: 3 },
    },

    {
        id: 'mysteriousSeed',
        name: '神秘种子',
        icon: '🌱',
        message: '你捡到了一些不知从哪飘来的种子，看起来是萝卜种子！',
        type: 'success',
        weight: 8,
        condition: null,
        effect: 'freeItem',
        effectParam: { itemName: '萝卜', count: 5 },
    },

    {
        id: 'harvestBlessing',
        name: '丰收祝福',
        icon: '✨',
        message: '空气中弥漫着神奇的气息，接下来 2 天所有作物产量翻倍！',
        type: 'event',
        weight: 4,
        condition: 'hasPlanted',
        effect: 'blessingTemp',
        effectParam: { days: 2 },
    },

    {
        id: 'mallSale',
        name: '商城打折',
        icon: '🛒',
        message: '道具商城今天正在促销，所有商品 8 折，持续 2 天！',
        type: 'event',
        weight: 6,
        condition: null,
        effect: 'mallDiscount',
        effectParam: { percent: 0.20, days: 2 },
    },

    /* ============ 中性事件 ============ */

    {
        id: 'cureWave',
        name: '治愈之风',
        icon: '💚',
        message: '一阵神奇的微风拂过，所有生病的作物都恢复了健康！',
        type: 'success',
        weight: 6,
        condition: 'hasPlanted',
        effect: 'cureAll',
        effectParam: {},
    },

    /* ============ 负面事件 ============ */

    {
        id: 'sickness',
        name: '病害蔓延',
        icon: '🦠',
        message: '一种奇怪的病害在农田中蔓延，有几块地的作物生病了！',
        type: 'danger',
        weight: 10,
        condition: 'hasPlanted',
        effect: 'sickenCrops',
        effectParam: { maxCount: 3 },
    },

    {
        id: 'theft',
        name: '小偷来袭',
        icon: '🥷',
        message: '夜晚来了小偷，偷走了一些金币！',
        type: 'danger',
        weight: 8,
        condition: 'gapFromLastTheft',
        conditionParam: 3,       // 距上次小偷至少 3 天
        effect: 'loseGoldPercent',
        effectParam: { percent: 0.10 },
    },

    {
        id: 'birds',
        name: '鸟儿偷食',
        icon: '🐦',
        message: '一群鸟儿飞过，吃掉了一些快成熟的作物！',
        type: 'warning',
        weight: 8,
        condition: 'hasMature',
        effect: 'sickenCrops',     // 复用生病逻辑，但只影响成熟作物
        effectParam: { maxCount: 1, matureOnly: true },
    },

];

/* ============================================================
   查询辅助
   ============================================================ */

/**
 * 根据 id 获取事件
 */
function getEventById(id) {
    return RANDOM_EVENTS.find(e => e.id === id) || null;
}

/**
 * 按权重随机抽 1 个事件（不检查条件）
 * @returns {object|null}
 */
function pickRandomEvent() {
    if (RANDOM_EVENTS.length === 0) return null;
    const total = RANDOM_EVENTS.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * total;
    for (const e of RANDOM_EVENTS) {
        roll -= e.weight;
        if (roll <= 0) return e;
    }
    return RANDOM_EVENTS[RANDOM_EVENTS.length - 1];
}

/**
 * 检查事件条件是否满足（具体逻辑放在 eventSystem.js 里）
 * 这里只是把"条件类型"翻译成"检查函数名"，方便 UI 展示
 */
function getEventConditionLabel(condition) {
    const labels = {
        'notScarecrow':       '需要没有稻草人',
        'hasPlanted':         '需要有种植中的作物',
        'hasMature':          '需要有成熟的作物',
        'hasInventory':       '仓库里需要有物品',
        'goldOver':           '金币需要达到指定值',
        'dayOver':            '天数需要达到指定值',
        'gapFromLastTheft':   '距上次小偷需要间隔足够',
        'merchantNotPresent': '商人当前不在场',
    };
    return labels[condition] || condition;
}