/* ============================================================
   currencies.js  —  5-Tier Currency System + Helpers
   Version: v1.0.1

   Currency tiers (low → high):
     1. Copper      (copper)     base currency, owned from the start
     2. Copper Coin (copperCoin) 110 copper → 1 copper coin
     3. Silver      (silver)     110 copper coins → 1 silver
     4. Gold Coin   (goldCoin)   110 silver → 1 gold coin
     5. Diamond     (diamond)    110 gold coins → 1 diamond

   Downgrade (few → many):
     1 copper coin → 100 copper
     1 silver      → 100 copper coins
     1 gold coin   → 100 silver
     1 diamond     → 100 gold coins

   Upgrades cost 110, downgrades yield 100 — a 10% loss per exchange.
   ============================================================ */

const CURRENCIES = [
    {
        id: 'copper',
        name: 'Copper',
        icon: '🟤',
        level: 1,
        color: '#8d6e63',
        description: 'The most basic currency, used for low-tier crops and items',
    },
    {
        id: 'copperCoin',
        name: 'Copper Coin',
        icon: '🟠',
        level: 2,
        color: '#e67e22',
        description: 'Mid-tier currency, used to buy mid-tier crops',
    },
    {
        id: 'silver',
        name: 'Silver',
        icon: '⚪',
        level: 3,
        color: '#95a5a6',
        description: 'High-tier currency, used for advanced crops and items',
    },
    {
        id: 'goldCoin',
        name: 'Gold Coin',
        icon: '🟡',
        level: 4,
        color: '#f1c40f',
        description: 'Rare currency, used for top-tier crops and items',
    },
    {
        id: 'diamond',
        name: 'Diamond',
        icon: '💎',
        level: 5,
        color: '#3498db',
        description: 'Top-tier currency, used for legendary items',
    },
];

/* ============================================================
   Queries
   ============================================================ */

/**
 * Get currency definition by id
 * @param {string} id
 * @returns {object|null}
 */
function getCurrencyById(id) {
    return CURRENCIES.find(c => c.id === id) || null;
}

/**
 * Get currency definition by level (1-5)
 * @param {number} level
 * @returns {object|null}
 */
function getCurrencyByLevel(level) {
    return CURRENCIES.find(c => c.level === level) || null;
}

/**
 * Get the base currency (copper)
 */
function getBaseCurrency() {
    return CURRENCIES[0];
}

/**
 * Get the top currency (diamond)
 */
function getTopCurrency() {
    return CURRENCIES[CURRENCIES.length - 1];
}

/* ============================================================
   Formatting
   ============================================================ */

/**
 * Format a single currency amount
 * @param {number} amount
 * @param {string} currencyId
 * @param {boolean} withIcon
 */
function formatAmount(amount, currencyId = 'copper', withIcon = true) {
    const cur = getCurrencyById(currencyId);
    if (!cur) return formatNumber(amount);
    const prefix = withIcon ? cur.icon + ' ' : '';
    return prefix + formatNumber(amount);
}

/**
 * Break a total copper amount into the five currency tiers
 * Uses base 110 (matching the exchange rules)
 * @param {number} totalCopper
 * @returns {object} { copper, copperCoin, silver, goldCoin, diamond }
 */
function breakdownCopper(totalCopper) {
    const result = {
        copper: 0,
        copperCoin: 0,
        silver: 0,
        goldCoin: 0,
        diamond: 0,
    };

    let remaining = Math.max(0, Math.floor(totalCopper));
    if (remaining === 0) return result;

    const RATE = CURRENCY_UP_RATE;

    result.diamond = Math.floor(remaining / Math.pow(RATE, 4));
    remaining -= result.diamond * Math.pow(RATE, 4);

    result.goldCoin = Math.floor(remaining / Math.pow(RATE, 3));
    remaining -= result.goldCoin * Math.pow(RATE, 3);

    result.silver = Math.floor(remaining / Math.pow(RATE, 2));
    remaining -= result.silver * Math.pow(RATE, 2);

    result.copperCoin = Math.floor(remaining / RATE);
    remaining -= result.copperCoin * RATE;

    result.copper = remaining;

    return result;
}

/**
 * Format a breakdown result into a display string
 * @param {object} b   return value of breakdownCopper()
 * @param {object} opts { compact: bool }
 * @returns {string}
 */
function formatBreakdown(b, opts = {}) {
    const compact = opts.compact === true;
    const parts = [];

    if (b.diamond  > 0) parts.push(`${b.diamond} ${compact ? '💎' : 'Diamond'}`);
    if (b.goldCoin > 0) parts.push(`${b.goldCoin} ${compact ? '🟡' : 'Gold Coin'}`);
    if (b.silver   > 0) parts.push(`${b.silver} ${compact ? '⚪' : 'Silver'}`);
    if (b.copperCoin > 0) parts.push(`${b.copperCoin} ${compact ? '🟠' : 'Copper Coin'}`);
    if (b.copper   > 0 || parts.length === 0) {
        parts.push(`${b.copper} ${compact ? '🟤' : 'Copper'}`);
    }

    return parts.join(' ');
}

/**
 * Composite formatter: picks single/multi currency display based on settings
 * @param {number} totalCopper
 * @returns {string}
 */
function formatCurrencyTotal(totalCopper) {
    /* 货币体系已统一为「金币」，不再做铜板/铜币/银币/金币/钻石币分级显示 */
    const amount = Math.max(0, Math.floor(totalCopper));
    return (typeof formatNumber === 'function' ? formatNumber(amount) : String(amount)) + ' 💰';
}
