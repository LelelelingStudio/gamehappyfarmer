/* ============================================================
   merchants.js  —  5 个植物商人定义
   版本：v1.0.1

   出场概率：
     - 各商人有 weight，按权重随机
     - 连续两次不会是同一商人（MERCHANT_NO_REPEAT）

   价格规则：
     - priceRules.default         基础倍数
     - priceRules.categoryBonus   { 分类: 额外倍数 }
     - priceRules.bulkThreshold   大单阈值（件数）
     - priceRules.bulkMultiplier  大单倍数

   收购规则：
     - acceptsRules.minItemLevel  只收购等级 ≥ N 的物品
     - acceptsRules.categories    只收购指定分类（null = 全部）
   ============================================================ */

const MERCHANTS = [
    /* ===== 1. 小新（新手商人）===== */
    {
        id: 'xiaoxin',
        name: '小新',
        avatar: '🧒',
        tagline: '什么都收，但会砍价',
        description: '你好！我是新来的商人小新，虽然价格不高，但我什么都收！',
        weight: 18,                       // 出场概率权重
        priceRules: {
            default: 0.75,                // 所有物品 ×0.75
        },
        acceptsRules: {
            minItemLevel: 0,              // 什么等级都收
        },
    },

    /* ===== 2. 杰克（加工品爱好者）===== */
    {
        id: 'jack',
        name: '杰克',
        avatar: '👨‍🌾',
        tagline: '加工品给高价，作物砍一点',
        description: '嗨！我是杰克，专门收购加工品，价格绝对让你满意！',
        weight: 22,
        priceRules: {
            default: 0.95,                // 默认 ×0.95
            categoryBonus: {
                food:     1.2,            // 加工食品 ×1.2（叠加）
                drink:    1.2,            // 加工饮品 ×1.2
                material: 1.2,            // 加工材料 ×1.2
                medicine: 1.2,            // 加工药品 ×1.2
            },
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 3. 艾米（水果 + 药材）===== */
    {
        id: 'amy',
        name: '艾米',
        avatar: '👩‍🌾',
        tagline: '水果和药材出高价',
        description: '你好呀！我是艾米，最喜欢收购新鲜的水果和珍贵的药材啦！',
        weight: 22,
        priceRules: {
            default: 1.0,                 // 默认原价
            categoryBonus: {
                fruit:    1.2,            // 水果 ×1.2
                medicine: 1.2,            // 药材 ×1.2
            },
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 4. 鲍比（大单生意）===== */
    {
        id: 'bobby',
        name: '鲍比',
        avatar: '🧔',
        tagline: '大单生意，多多益善',
        description: '嘿！我是鲍比。你如果有 10 件以上的货一起卖，我给你更好的价格！',
        weight: 21,
        priceRules: {
            default: 0.95,                // 默认 ×0.95
            bulkThreshold: 10,            // 单件物品数量 ≥ 10 触发
            bulkMultiplier: 1.15,         // 触发后 ×1.15
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 5. 老王（老手商人，只收稀有）===== */
    {
        id: 'laowang',
        name: '老王',
        avatar: '👴',
        tagline: '只收稀有物品，价格厚道',
        description: '年轻人，我只收稀有物品。普通货色就别拿给我看了。',
        weight: 17,
        priceRules: {
            default: 1.1,                 // 所有 ×1.1
        },
        acceptsRules: {
            minItemLevel: 15,             // 只收等级 ≥ 15 的作物/加工品
        },
    },
];

/* ============================================================
   查询辅助
   ============================================================ */

/**
 * 根据 id 获取商人
 */
function getMerchantById(id) {
    return MERCHANTS.find(m => m.id === id) || null;
}

/**
 * 按权重随机选一个商人
 * @param {string} excludeId  排除的商人 id（防止连续重复）
 * @returns {object}
 */
function pickRandomMerchant(excludeId = null) {
    let pool = MERCHANTS;
    if (excludeId && MERCHANT_NO_REPEAT) {
        pool = MERCHANTS.filter(m => m.id !== excludeId);
        if (pool.length === 0) pool = MERCHANTS;  // 只有一个商人的兜底
    }
    const total = pool.reduce((sum, m) => sum + m.weight, 0);
    let roll = Math.random() * total;
    for (const m of pool) {
        roll -= m.weight;
        if (roll <= 0) return m;
    }
    return pool[pool.length - 1];
}

/**
 * 获取商人头像（用于显示）
 */
function getMerchantAvatar(merchant) {
    return merchant && merchant.avatar ? merchant.avatar : '🧑‍💼';
}