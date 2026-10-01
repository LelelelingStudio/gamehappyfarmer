/* ============================================================
   crops/index.js  —  Crops Main Entry
   Aggregates 10 series, provides unified query interface
   Version: v1.0.1
   ============================================================ */

/* -------- Aggregate all series -------- */
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

/* -------- Index by id -------- */
const CROPS_BY_ID = {};
CROPS_ALL.forEach(c => { CROPS_BY_ID[c.id] = c; });

/* -------- Index by name -------- */
const CROPS_BY_NAME = {};
CROPS_ALL.forEach(c => { CROPS_BY_NAME[c.name] = c; });

/* -------- Index by category -------- */
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

/* -------- Category display names -------- */
const CROP_CATEGORY_NAMES = {
    vegetable: 'Vegetable',
    fruit:     'Fruit',
    grain:     'Grain',
    medicine:  'Medicine',
    flower:    'Flower',
    tropical:  'Tropical',
    mushroom:  'Mushroom',
    spice:     'Spice',
    magic:     'Magic',
    legend:    'Legend',
};

/* ============================================================
   Query Functions
   ============================================================ */

/**
 * Get a crop by id
 * @param {number} id
 * @returns {object|null}
 */
function getCropById(id) {
    return CROPS_BY_ID[id] || null;
}

/**
 * Get a crop by name
 * @param {string} name
 * @returns {object|null}
 */
function getCropByName(name) {
    return CROPS_BY_NAME[name] || null;
}

/**
 * Get all crops in a category
 * @param {string} category
 * @returns {array}
 */
function getCropsByCategory(category) {
    return CROPS_BY_CATEGORY[category] || [];
}

/**
 * Get the display name of a category
 */
function getCropCategoryName(category) {
    return CROP_CATEGORY_NAMES[category] || category;
}

/**
 * Get all crops unlocked at the player's current level
 * @param {number} level
 * @returns {array}
 */
function getCropsByLevel(level) {
    return CROPS_ALL.filter(c => c.unlockLevel <= level);
}

/**
 * Get crops unlocked at the player's current level within a category
 * @param {number} level
 * @param {string} category
 * @returns {array}
 */
function getCropsByLevelAndCategory(level, category) {
    return getCropsByCategory(category).filter(c => c.unlockLevel <= level);
}

/**
 * Get the next crop to unlock in a series
 * @param {number} level
 * @param {string} category
 * @returns {object|null}
 */
function getNextCropInCategory(level, category) {
    return getCropsByCategory(category).find(c => c.unlockLevel > level) || null;
}

/**
 * Fuzzy search crops by name
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
 * Filter by currency tier
 * @param {string} currency
 * @returns {array}
 */
function getCropsByCurrency(currency) {
    return CROPS_ALL.filter(c => c.currency === currency);
}

/**
 * Get a random crop
 * @returns {object}
 */
function getRandomCrop() {
    return CROPS_ALL[Math.floor(Math.random() * CROPS_ALL.length)];
}

/* ============================================================
   Statistics (for development debugging)
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
/* -------- Locale-specific item naming (seeds / tiller) -------- */
const SEED_NAME_SUFFIX = ' Seeds';
const TILL_MACHINE_ITEM_NAME = 'Tiller';
