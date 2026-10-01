/* ============================================================
   events.js  —  Random Event Table
   Version: v1.0.1

   Design principles:
     - Data-driven: events describe "what condition + what effect", no logic
     - Logic is interpreted uniformly by eventSystem.js
     - Conditions are strings + params, effects are strings + params

   Fields:
     id              unique identifier
     name            event name (for the log)
     icon            icon (Emoji)
     message         message shown to the player
     type            'success' | 'warning' | 'danger' | 'event'
     weight          draw weight
     condition       trigger condition (string), null means unconditional
     conditionParam  condition parameter (number, etc.)
     effect          effect (string)
     effectParam     effect parameter (object)

   Condition types:
     'notScarecrow'        no scarecrow
     'hasPlanted'          at least one planted plot
     'hasMature'           at least one mature plot
     'hasInventory'        inventory is not empty
     'goldOver'            gold >= N
     'dayOver'             current day >= N
     'gapFromLastTheft'    days since last theft >= N
     'merchantNotPresent'  no merchant currently present

   Effect types:
     'gainGold'            gain gold {amount}
     'gainGoldRandom'      gain random gold {min, max}
     'loseGoldPercent'     lose N% of gold {percent}
     'sickenCrops'         sicken N plots {maxCount}
     'cureAll'             cure all sick crops
     'boostAllGrowth'      all crops grow +N days {days}
     'waterAll'            automatically water all crops
     'merchantEarly'       merchant arrives early
     'mallDiscount'        mall discount {percent, days}
     'freeItem'            free item {itemName, count}
     'blessingTemp'        temporary harvest blessing {days}
   ============================================================ */

const RANDOM_EVENTS = [

    /* ============ Positive Events ============ */

    {
        id: 'treasure',
        name: 'Treasure Chest',
        icon: '🎁',
        message: 'You found a treasure chest at the edge of the field and gained 100 gold!',
        type: 'success',
        weight: 15,
        condition: null,
        effect: 'gainGold',
        effectParam: { amount: 100 },
    },

    {
        id: 'luckyDay',
        name: 'Lucky Day',
        icon: '🍀',
        message: 'Today is a lucky day — you stumbled on some unexpected money!',
        type: 'success',
        weight: 12,
        condition: null,
        effect: 'gainGoldRandom',
        effectParam: { min: 50, max: 200 },
    },

    {
        id: 'sunshine',
        name: 'Bright Sunshine',
        icon: '☀️',
        message: 'Today is especially sunny — all crops grew an extra day!',
        type: 'success',
        weight: 14,
        condition: 'hasPlanted',
        effect: 'boostAllGrowth',
        effectParam: { days: 1 },
    },

    {
        id: 'rainBlessing',
        name: 'Welcome Rain',
        icon: '🌧️',
        message: 'A timely rain sweeps across the farm — all crops are well watered!',
        type: 'success',
        weight: 10,
        condition: 'hasPlanted',
        effect: 'waterAll',
        effectParam: {},
    },

    {
        id: 'merchantEarly',
        name: 'Early Merchant',
        icon: '🏃',
        message: 'A merchant has arrived early, saying they have urgent business!',
        type: 'event',
        weight: 8,
        condition: 'merchantNotPresent',
        effect: 'merchantEarly',
        effectParam: {},
    },

    {
        id: 'freeFertilizer',
        name: 'Fertilizer Giveaway',
        icon: '🌿',
        message: 'A passing farmer gave you 3 bags of ordinary fertilizer!',
        type: 'success',
        weight: 8,
        condition: null,
        effect: 'freeItem',
        effectParam: { itemName: '普通肥料', count: 3 },
    },

    {
        id: 'mysteriousSeed',
        name: 'Mysterious Seeds',
        icon: '🌱',
        message: 'You picked up some seeds blown in from who-knows-where — they look like radish seeds!',
        type: 'success',
        weight: 8,
        condition: null,
        effect: 'freeItem',
        effectParam: { itemName: 'Radish', count: 5 },
    },

    {
        id: 'harvestBlessing',
        name: 'Harvest Blessing',
        icon: '✨',
        message: 'A magical aura fills the air — for the next 2 days, all crop yields are doubled!',
        type: 'event',
        weight: 4,
        condition: 'hasPlanted',
        effect: 'blessingTemp',
        effectParam: { days: 2 },
    },

    {
        id: 'mallSale',
        name: 'Mall Sale',
        icon: '🛒',
        message: 'The item mall is running a sale today — everything 20% off for 2 days!',
        type: 'event',
        weight: 6,
        condition: null,
        effect: 'mallDiscount',
        effectParam: { percent: 0.20, days: 2 },
    },

    /* ============ Neutral Events ============ */

    {
        id: 'cureWave',
        name: 'Healing Breeze',
        icon: '💚',
        message: 'A magical breeze sweeps through — all sick crops are healthy again!',
        type: 'success',
        weight: 6,
        condition: 'hasPlanted',
        effect: 'cureAll',
        effectParam: {},
    },

    /* ============ Negative Events ============ */

    {
        id: 'sickness',
        name: 'Disease Outbreak',
        icon: '🦠',
        message: 'A strange disease spreads through the farm — several plots have been infected!',
        type: 'danger',
        weight: 10,
        condition: 'hasPlanted',
        effect: 'sickenCrops',
        effectParam: { maxCount: 3 },
    },

    {
        id: 'theft',
        name: 'Thief in the Night',
        icon: '🥷',
        message: 'A thief came at night and stole some of your gold!',
        type: 'danger',
        weight: 8,
        condition: 'gapFromLastTheft',
        conditionParam: 3,       // at least 3 days since the last theft
        effect: 'loseGoldPercent',
        effectParam: { percent: 0.10 },
    },

    {
        id: 'birds',
        name: 'Birds Feeding',
        icon: '🐦',
        message: 'A flock of birds flew by and ate some of your almost-ripe crops!',
        type: 'warning',
        weight: 8,
        condition: 'hasMature',
        effect: 'sickenCrops',     // reuses sickness logic but only affects mature crops
        effectParam: { maxCount: 1, matureOnly: true },
    },

];

/* ============================================================
   Query helpers
   ============================================================ */

/**
 * Get an event by id
 */
function getEventById(id) {
    return RANDOM_EVENTS.find(e => e.id === id) || null;
}

/**
 * Draw a random event by weight (does not check conditions)
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
 * Check whether an event condition is satisfied (actual logic lives in eventSystem.js)
 * This just translates the "condition type" into a label for UI display
 */
function getEventConditionLabel(condition) {
    const labels = {
        'notScarecrow':       'Requires no scarecrow',
        'hasPlanted':         'Requires at least one planted crop',
        'hasMature':          'Requires at least one mature crop',
        'hasInventory':       'Requires items in storage',
        'goldOver':           'Gold must reach the required value',
        'dayOver':            'Day count must reach the required value',
        'gapFromLastTheft':   'Enough days must have passed since the last theft',
        'merchantNotPresent': 'No merchant currently present',
    };
    return labels[condition] || condition;
}