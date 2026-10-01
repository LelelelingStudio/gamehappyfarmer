/* ============================================================
   merchants.js  —  5 Plant Merchant Definitions
   Version: v1.0.1

   Appearance chance:
     - Each merchant has a weight, chosen randomly by weight
     - The same merchant will not appear twice in a row (MERCHANT_NO_REPEAT)

   Price rules:
     - priceRules.default         base multiplier
     - priceRules.categoryBonus   { category: extra multiplier }
     - priceRules.bulkThreshold   bulk order threshold (item count)
     - priceRules.bulkMultiplier  bulk order multiplier

   Purchase rules:
     - acceptsRules.minItemLevel  only buys items of level ≥ N
     - acceptsRules.categories    only buys specified categories (null = all)
   ============================================================ */

const MERCHANTS = [
    /* ===== 1. Xiaoxin (novice merchant) ===== */
    {
        id: 'xiaoxin',
        name: 'Xiaoxin',
        avatar: '🧒',
        tagline: 'Buys anything, but haggles',
        description: 'Hello! I\'m Xiaoxin, a new merchant. The price isn\'t high, but I buy anything!',
        weight: 18,                       // appearance weight
        priceRules: {
            default: 0.75,                // all items ×0.75
        },
        acceptsRules: {
            minItemLevel: 0,              // buys items of any level
        },
    },

    /* ===== 2. Jack (processed goods enthusiast) ===== */
    {
        id: 'jack',
        name: 'Jack',
        avatar: '👨‍🌾',
        tagline: 'Pays well for processed goods, cuts a bit on crops',
        description: 'Hi! I\'m Jack. I specialize in buying processed goods, and the price will definitely satisfy you!',
        weight: 22,
        priceRules: {
            default: 0.95,                // default ×0.95
            categoryBonus: {
                food:     1.2,            // processed food ×1.2 (stacking)
                drink:    1.2,            // processed drink ×1.2
                material: 1.2,            // processed material ×1.2
                medicine: 1.2,            // processed medicine ×1.2
            },
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 3. Amy (fruit + medicine) ===== */
    {
        id: 'amy',
        name: 'Amy',
        avatar: '👩‍🌾',
        tagline: 'Pays well for fruit and medicine',
        description: 'Hello there! I\'m Amy. I love buying fresh fruit and precious medicinal herbs the most!',
        weight: 22,
        priceRules: {
            default: 1.0,                 // default at original price
            categoryBonus: {
                fruit:    1.2,            // fruit ×1.2
                medicine: 1.2,            // medicine ×1.2
            },
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 4. Bobby (bulk business) ===== */
    {
        id: 'bobby',
        name: 'Bobby',
        avatar: '🧔',
        tagline: 'Bulk business, the more the better',
        description: 'Hey! I\'m Bobby. If you sell 10 or more of the same item at once, I\'ll give you a better price!',
        weight: 21,
        priceRules: {
            default: 0.95,                // default ×0.95
            bulkThreshold: 10,            // triggers when a single item count ≥ 10
            bulkMultiplier: 1.15,         // ×1.15 after triggering
        },
        acceptsRules: {
            minItemLevel: 0,
        },
    },

    /* ===== 5. Old Wang (veteran merchant, only buys rare goods) ===== */
    {
        id: 'laowang',
        name: 'Old Wang',
        avatar: '👴',
        tagline: 'Only buys rare items, prices are fair',
        description: 'Young one, I only buy rare items. Don\'t bother showing me ordinary goods.',
        weight: 17,
        priceRules: {
            default: 1.1,                 // all ×1.1
        },
        acceptsRules: {
            minItemLevel: 15,             // only buys crops/processed goods of level ≥ 15
        },
    },
];

/* ============================================================
   Query Helpers
   ============================================================ */

/**
 * Get a merchant by id
 */
function getMerchantById(id) {
    return MERCHANTS.find(m => m.id === id) || null;
}

/**
 * Randomly pick a merchant by weight
 * @param {string} excludeId  merchant id to exclude (to prevent consecutive repeats)
 * @returns {object}
 */
function pickRandomMerchant(excludeId = null) {
    let pool = MERCHANTS;
    if (excludeId && MERCHANT_NO_REPEAT) {
        pool = MERCHANTS.filter(m => m.id !== excludeId);
        if (pool.length === 0) pool = MERCHANTS;  // fallback when only one merchant exists
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
 * Get the merchant's avatar (for display)
 */
function getMerchantAvatar(merchant) {
    return merchant && merchant.avatar ? merchant.avatar : '🧑‍💼';
}