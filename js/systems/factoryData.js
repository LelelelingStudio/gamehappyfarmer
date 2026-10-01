/* ============================================================
   factoryData.js  —  Factory Products Data Aggregation and Query
   This file aggregates all factory product data and provides query functions.
   ============================================================ */

/* Global arrays for each level, populated by language-specific data files */
let FACTORY_PRODUCTS_LV1 = [];
let FACTORY_PRODUCTS_LV2 = [];
let FACTORY_PRODUCTS_LV3 = [];
let FACTORY_PRODUCTS_LV4 = [];
let FACTORY_PRODUCTS_LV5_9 = [];

/* Aggregated list of all factory products */
let FACTORY_PRODUCTS_ALL = [];

/* Indexed by ID and Name for quick lookup */
let FACTORY_PRODUCTS_BY_ID = {};
let FACTORY_PRODUCTS_BY_NAME = {};
let FACTORY_PRODUCTS_BY_LEVEL = {};
let FACTORY_PRODUCTS_BY_CATEGORY = {};

/* Category display names (will be translated by UI language pack) */
let FACTORY_CATEGORY_NAMES = {};

/* 1 级加工品按作物系列拆成 10 个数组，聚合顺序固定 */
const FACTORY_LV1_GROUPS = [
    'VEGETABLE', 'FRUIT', 'GRAIN', 'MEDICINE', 'FLOWER',
    'TROPICAL', 'MUSHROOM', 'SPICE', 'MAGIC', 'LEGEND',
];

/**
 * 把 1 级加工品的 10 个系列数组汇总成 FACTORY_PRODUCTS_LV1。
 * 数据文件是纯数据、按系列分文件，聚合放在这里，避免数据文件之间互相依赖。
 */
function collectLevel1Products() {
    const out = [];
    for (const group of FACTORY_LV1_GROUPS) {
        const root = (typeof globalThis !== 'undefined') ? globalThis : window;
        const arr = root['FACTORY_PRODUCTS_LV1_' + group];
        if (Array.isArray(arr)) out.push(...arr);
    }
    return out;
}

/**
 * 需求项归一化：
 *  - 加工品需求形如 { productId, amount }
 *  - 1 级加工品的原料是“作物”，数据里写作 { cropId, amount }
 * 统一补上 kind / name / icon，UI 与系统层就不用再区分两种情况。
 */
function normalizeFactoryRequirements(products) {
    const cropName = (cropId) => {
        if (typeof CROPS_BY_ID !== 'undefined' && CROPS_BY_ID[cropId]) return CROPS_BY_ID[cropId].name;
        return '';
    };
    const cropIcon = (cropId) => {
        if (typeof CROPS_BY_ID !== 'undefined' && CROPS_BY_ID[cropId]) return CROPS_BY_ID[cropId].icon;
        return '🌱';
    };
    for (const p of products) {
        if (!Array.isArray(p.requirements)) continue;
        p.requirements = p.requirements.map((req) => {
            if (!req) return req;
            if (req.productId == null && req.cropId != null) {
                return {
                    cropId: req.cropId,
                    amount: req.amount || 1,
                    kind: 'crop',
                    name: req.name || cropName(req.cropId),
                    icon: req.icon || cropIcon(req.cropId),
                };
            }
            return Object.assign({ kind: 'product' }, req);
        });
    }
}

/**
 * 把任意一条需求解析成统一结构，供系统层 / UI 使用。
 * @returns {{kind:'crop'|'product', id:number, name:string, icon:string, amount:number, sellPrice:number}|null}
 */
function resolveFactoryIngredient(req) {
    if (!req) return null;
    if (req.productId == null && req.cropId != null) {
        const crop = (typeof CROPS_BY_ID !== 'undefined') ? CROPS_BY_ID[req.cropId] : null;
        return {
            kind: 'crop',
            id: req.cropId,
            name: req.name || (crop ? crop.name : ''),
            icon: req.icon || (crop ? crop.icon : '🌱'),
            amount: req.amount || 1,
            sellPrice: crop ? (crop.sellPrice || 0) : 0,
        };
    }
    const product = getFactoryProductById(req.productId);
    return {
        kind: 'product',
        id: req.productId,
        name: req.name || (product ? product.name : ''),
        icon: req.icon || (product ? product.icon : '📦'),
        amount: req.amount || 1,
        sellPrice: product ? (product.sellPrice || 0) : 0,
    };
}

/**
 * Call this function after all language-specific factory product data has been loaded.
 * It aggregates and indexes all factory products.
 */
function initializeFactoryProducts() {
    /* 1 级加工品：数据里分成 10 个系列数组，这里聚合（若数据文件已自行提供总表则沿用） */
    const level1 = collectLevel1Products();
    if (level1.length > 0) {
        FACTORY_PRODUCTS_LV1 = level1;
    } else if (!Array.isArray(FACTORY_PRODUCTS_LV1)) {
        FACTORY_PRODUCTS_LV1 = [];
    }

    // Aggregation
    FACTORY_PRODUCTS_ALL = [
        ...FACTORY_PRODUCTS_LV1,
        ...FACTORY_PRODUCTS_LV2,
        ...FACTORY_PRODUCTS_LV3,
        ...FACTORY_PRODUCTS_LV4,
        ...FACTORY_PRODUCTS_LV5_9,
    ];

    // 需求项归一化（作物原料 / 加工品原料）
    normalizeFactoryRequirements(FACTORY_PRODUCTS_ALL);

    // Indexes
    FACTORY_PRODUCTS_BY_ID = {};
    FACTORY_PRODUCTS_BY_NAME = {};
    FACTORY_PRODUCTS_ALL.forEach(p => { FACTORY_PRODUCTS_BY_ID[p.id] = p; });
    FACTORY_PRODUCTS_ALL.forEach(p => { FACTORY_PRODUCTS_BY_NAME[p.name] = p; });

    // By level
    FACTORY_PRODUCTS_BY_LEVEL = {
        1: FACTORY_PRODUCTS_LV1,
        2: FACTORY_PRODUCTS_LV2,
        3: FACTORY_PRODUCTS_LV3,
        4: FACTORY_PRODUCTS_LV4,
        5: FACTORY_PRODUCTS_LV5_9.filter(p => p.level === 5),
        6: FACTORY_PRODUCTS_LV5_9.filter(p => p.level === 6),
        7: FACTORY_PRODUCTS_LV5_9.filter(p => p.level === 7),
        8: FACTORY_PRODUCTS_LV5_9.filter(p => p.level === 8),
        9: FACTORY_PRODUCTS_LV5_9.filter(p => p.level === 9),
    };

    // By category
    FACTORY_PRODUCTS_BY_CATEGORY = {};
    for (const p of FACTORY_PRODUCTS_ALL) {
        if (!FACTORY_PRODUCTS_BY_CATEGORY[p.category]) {
            FACTORY_PRODUCTS_BY_CATEGORY[p.category] = [];
        }
        FACTORY_PRODUCTS_BY_CATEGORY[p.category].push(p);
    }

    // Category display names
    FACTORY_CATEGORY_NAMES = {
        food:     t('factoryCategory.food'),
        drink:    t('factoryCategory.drink'),
        material: t('factoryCategory.material'),
        medicine: t('factoryCategory.medicine'),
        magic:    t('factoryCategory.magic'),
    };
}

/* ============================================================
   Query Functions
   ============================================================ */

/**
 * Get a factory product by id
 */
function getFactoryProductById(id) {
    return FACTORY_PRODUCTS_BY_ID[id] || null;
}

/**
 * Get a factory product by name
 */
function getFactoryProductByName(name) {
    return FACTORY_PRODUCTS_BY_NAME[name] || null;
}

/**
 * Get all factory products by level (1-9)
 */
function getFactoryProductsByLevel(level) {
    return FACTORY_PRODUCTS_BY_LEVEL[level] || [];
}

/**
 * Get all factory products by category
 */
function getFactoryProductsByCategory(category) {
    return FACTORY_PRODUCTS_BY_CATEGORY[category] || [];
}

/**
 * Get the display name of a category
 */
function getFactoryCategoryName(category) {
    return FACTORY_CATEGORY_NAMES[category] || category;
}

/**
 * Get all factory products unlocked at the player's current level
 */
function getAvailableFactoryProducts(playerLevel) {
    return FACTORY_PRODUCTS_ALL.filter(p => p.unlockLevel <= playerLevel);
}

/**
 * Get factory products unlocked at the player's current level, filtered by category and/or level
 */
function getAvailableFactoryProductsFiltered(playerLevel, category = null, levelFilter = null) {
    return FACTORY_PRODUCTS_ALL.filter(p => {
        if (p.unlockLevel > playerLevel) return false;
        if (category && p.category !== category) return false;
        if (levelFilter && p.level !== levelFilter) return false;
        return true;
    });
}

/**
 * Get all direct ingredients of a factory product
 * @param {number} productId
 * @returns {array} [{productId, name, level, amount}]
 */
function getFactoryIngredients(productId) {
    const product = getFactoryProductById(productId);
    if (!product || !product.requirements) return [];
    return product.requirements.map((r) => {
        const ing = resolveFactoryIngredient(r) || {};
        return {
            productId: r.productId,
            cropId: r.cropId,
            kind: ing.kind || 'product',
            name: ing.name || 'Unknown',
            icon: ing.icon || '📦',
            level: (getFactoryProductById(r.productId) || {}).level || 0,
            amount: r.amount,
        };
    });
}

/**
 * Get which higher-tier products a factory product can be used in
 */
function getFactoryUsages(productId) {
    const result = [];
    for (const p of FACTORY_PRODUCTS_ALL) {
        if (!p.requirements) continue;
        for (const r of p.requirements) {
            if (r.productId === productId) {
                result.push({ id: p.id, name: p.name, level: p.level, amount: r.amount });
                break;
            }
        }
    }
    return result;
}

/**
 * Get the full chain of a factory product series (same name prefix) across all levels
 */
function getFactoryProductChain(productName) {
    const chain = [];
    for (const p of FACTORY_PRODUCTS_ALL) {
        if (p.name.includes(productName)) chain.push(p);
    }
    return chain;
}



