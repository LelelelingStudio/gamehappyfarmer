/* ============================================================
   fertilizers.js  —  5 Fertilizer Definitions
   Version: v1.0.1

   Effect: accelerates crop growth or instantly matures crops
   Usage: click a planted plot → select "Fertilize"
   Consumes 1 fertilizer per use

   Price unit: copper
   Progression: higher levels unlock stronger fertilizers
   ============================================================ */

const FERTILIZERS = [

    /* ===== 1. Normal Fertilizer ===== */
    {
        id: 'fertilizer_normal',
        name: 'Normal Fertilizer',
        icon: '🌿',
        description: 'Basic organic fertilizer, slightly accelerates crop growth',
        type: 'growthBoost',              // growth acceleration
        growthBonus: 0.10,                // +10% growth speed
        duration: 'harvest',              // lasts for 1 harvest
        maxStack: 1,                      // cannot be stacked
        price: 50,                        // 50 copper
        unlockLevel: 1,
        category: 'fertilizer',
    },

    /* ===== 2. Advanced Fertilizer ===== */
    {
        id: 'fertilizer_advanced',
        name: 'Advanced Fertilizer',
        icon: '🌾',
        description: 'Concentrated high-efficiency fertilizer, significantly accelerates crop growth',
        type: 'growthBoost',
        growthBonus: 0.30,                // +30%
        duration: 'harvest',
        maxStack: 1,
        price: 150,
        unlockLevel: 5,
        category: 'fertilizer',
    },

    /* ===== 3. Organic Fertilizer ===== */
    {
        id: 'fertilizer_organic',
        name: 'Organic Fertilizer',
        icon: '🍂',
        description: 'All-natural organic fertilizer, permanently boosts the plot\'s fertility (up to 2 stacks)',
        type: 'growthBoost',
        growthBonus: 0.20,                // +20%
        duration: 'permanent',            // permanent
        maxStack: FERTILIZER_ORGANIC_MAX_STACK,  // = 2 stack cap
        price: 400,
        unlockLevel: 10,
        category: 'fertilizer',
    },

    /* ===== 4. Magic Fertilizer ===== */
    {
        id: 'fertilizer_magic',
        name: 'Magic Fertilizer',
        icon: '✨',
        description: 'Magic-infused fertilizer, greatly accelerates growth for a short time (lasts 3 days)',
        type: 'growthBoost',
        growthBonus: 0.50,                // +50%
        duration: 'days',                 // lasts N days
        durationDays: 3,                  // 3 days
        maxStack: 1,                      // not stackable on the same plot
        price: 1000,
        unlockLevel: 20,
        category: 'fertilizer',
    },

    /* ===== 5. Legendary Fertilizer ===== */
    {
        id: 'fertilizer_legendary',
        name: 'Legendary Fertilizer',
        icon: '🌟',
        description: 'Legendary artifact fertilizer, instantly matures crops',
        type: 'instant',                  // instant maturity
        duration: 'consumable',           // one-time use
        maxStack: 1,
        price: 3000,
        unlockLevel: 30,
        category: 'fertilizer',
    },
];

/* ============================================================
   Query Helpers
   ============================================================ */

/**
 * Get a fertilizer by id
 */
function getFertilizerById(id) {
    return FERTILIZERS.find(f => f.id === id) || null;
}

/**
 * Get the list of fertilizers available at the player's current level
 * @param {number} level
 * @returns {array}
 */
function getAvailableFertilizers(level) {
    return FERTILIZERS.filter(f => level >= f.unlockLevel);
}

/**
 * Get the fertilizer's name in the inventory (used for inventory lookup)
 */
function getFertilizerInventoryName(fertilizer) {
    return fertilizer ? fertilizer.name : '';
}

/**
 * Check whether a fertilizer can be applied to a plot
 * @param {number} plotId
 * @param {object} fertilizer
 * @returns {object} { ok: boolean, reason: string }
 */
function canApplyFertilizer(plotId, fertilizer) {
    if (!fertilizer) return { ok: false, reason: 'Fertilizer does not exist' };

    const plot = getPlot(plotId);

    /* Must have a crop planted */
    if (plot.state !== 'planted' && plot.state !== 'sick') {
        return { ok: false, reason: 'This plot has no crop planted' };
    }

    /* Sick plots cannot be fertilized (cure first) */
    if (plot.state === 'sick') {
        return { ok: false, reason: 'The crop is sick, please cure it first' };
    }

    /* Mature crops do not need fertilizer */
    const crop = getCropById(plot.cropId);
    if (crop && plot.growthProgress >= crop.growthTime) {
        return { ok: false, reason: 'The crop is already mature, no need to fertilize' };
    }

    /* Check inventory */
    if (!gameState.inventory[fertilizer.name] ||
        gameState.inventory[fertilizer.name].count <= 0) {
        return { ok: false, reason: 'You do not have this fertilizer in storage' };
    }

    /* Check stack cap */
    if (fertilizer.duration === 'permanent') {
        const currentStack = (plot.fertilizerStack || 0);
        if (currentStack >= fertilizer.maxStack) {
            return { ok: false, reason: `This plot has reached the organic fertilizer cap (${fertilizer.maxStack} stacks)` };
        }
    }

    return { ok: true, reason: '' };
}