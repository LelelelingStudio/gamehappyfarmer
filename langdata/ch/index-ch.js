/* ============================================================
   crops/index.js  —  作物总入口
   汇总 10 个系列，提供统一查询接口
   版本：v1.0.1
   ============================================================ */

/* -------- 汇总所有系列 -------- */
const CROPS_ALL = [
    ...CROPS_VEGETABLE,   // 1-100
    ...CROPS_FRUIT,       // 101-200
    ...CROPS_GRAIN,       // 201-300
    ...CROPS_MEDICINE,    // 301-400
    ...CROPS_FLOWER,      // 401-500
    ...CROPS_TROPICAL,    // 501-600
    ...CROPS_MUSHROOM,    // 601-700
    ...CROPS_SPICE,       // 701-800
    ...CROPS_MAGIC,       // 801-900
    ...CROPS_LEGEND,      // 901-1000
];

/* -------- 按 id 索引 -------- */
const CROPS_BY_ID = {};
CROPS_ALL.forEach(c => { CROPS_BY_ID[c.id] = c; });

/* -------- 按名字索引 -------- */
const CROPS_BY_NAME = {};
CROPS_ALL.forEach(c => { CROPS_BY_NAME[c.name] = c; });

/* -------- 按分类索引 -------- */
const CROPS_BY_CATEGORY = {
    vegetable: CROPS_VEGETABLE,
    fruit:     CROPS_FRUIT,
    grain:     CROPS_GRAIN,
    medicine:  CROPS_MEDICINE,
    flower:    CROPS_FLOWER,
    tropical:  CROPS_TROPICAL,
    mushroom:  CROPS_MUSHROOM,
    spice:     CROPS_SPICE,
    magic:     CROPS_MAGIC,
    legend:    CROPS_LEGEND,
};

/* -------- 分类中文名 -------- */
const CROP_CATEGORY_NAMES = {
    vegetable: '蔬菜',
    fruit:     '水果',
    grain:     '谷物',
    medicine:  '药材',
    flower:    '花卉',
    tropical:  '热带',
    mushroom:  '菌类',
    spice:     '香料',
    magic:     '魔法',
    legend:    '传说',
};

/* ============================================================
   查询函数
   ============================================================ */

/**
 * 根据 id 获取作物
 * @param {number} id
 * @returns {object|null}
 */
function getCropById(id) {
    return CROPS_BY_ID[id] || null;
}

/**
 * 根据名字获取作物
 * @param {string} name
 * @returns {object|null}
 */
function getCropByName(name) {
    return CROPS_BY_NAME[name] || null;
}

/**
 * 获取某分类的全部作物
 * @param {string} category
 * @returns {array}
 */
function getCropsByCategory(category) {
    return CROPS_BY_CATEGORY[category] || [];
}

/**
 * 获取某分类中文名
 */
function getCropCategoryName(category) {
    return CROP_CATEGORY_NAMES[category] || category;
}

/**
 * 获取玩家当前等级能解锁的所有作物
 * @param {number} level
 * @returns {array}
 */
function getCropsByLevel(level) {
    return CROPS_ALL.filter(c => c.unlockLevel <= level);
}

/**
 * 获取玩家在某分类下、当前等级能解锁的作物
 * @param {number} level
 * @param {string} category
 * @returns {array}
 */
function getCropsByLevelAndCategory(level, category) {
    return getCropsByCategory(category).filter(c => c.unlockLevel <= level);
}

/**
 * 获取某系列下一个待解锁的作物
 * @param {number} level
 * @param {string} category
 * @returns {object|null}
 */
function getNextCropInCategory(level, category) {
    return getCropsByCategory(category).find(c => c.unlockLevel > level) || null;
}

/**
 * 模糊搜索作物（按名字）
 * @param {string} keyword
 * @param {number} limit
 * @returns {array}
 */
function searchCrops(keyword, limit = 50) {
    if (!keyword) return [];
    const lower = keyword.toLowerCase();
    const result = [];
    for (const c of CROPS_ALL) {
        if (c.name.toLowerCase().includes(lower)) {
            result.push(c);
            if (result.length >= limit) break;
        }
    }
    return result;
}

/**
 * 按货币等级过滤
 * @param {string} currency
 * @returns {array}
 */
function getCropsByCurrency(currency) {
    return CROPS_ALL.filter(c => c.currency === currency);
}

/**
 * 随机一个作物
 * @returns {object}
 */
function getRandomCrop() {
    return CROPS_ALL[Math.floor(Math.random() * CROPS_ALL.length)];
}

/* ============================================================
   统计（开发调试用）
   ============================================================ */
const CROPS_STATS = (() => {
    const stats = {
        total: CROPS_ALL.length,
        byCategory: {},
        byCurrency: {},
    };
    for (const c of CROPS_ALL) {
        stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
        stats.byCurrency[c.currency] = (stats.byCurrency[c.currency] || 0) + 1;
    }
    return stats;
})();
/* -------- 语言相关的物品命名（种子 / 翻土机）-------- */
const SEED_NAME_SUFFIX = '种子';
const TILL_MACHINE_ITEM_NAME = '翻土机';
