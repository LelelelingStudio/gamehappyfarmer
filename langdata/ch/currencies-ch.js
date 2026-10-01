/* ============================================================
   currencies.js  —  5 级货币定义 + 工具函数
   版本：v1.0.1

   货币等级（从低到高）：
     1. 铜板 (copper)      基础货币，初始拥有
     2. 铜币 (copperCoin)  110 铜板 → 1 铜币
     3. 银币 (silver)      110 铜币 → 1 银币
     4. 金币 (goldCoin)    110 银币 → 1 金币
     5. 钻石币 (diamond)   110 金币 → 1 钻石币

   向下兑换（少换多）：
     1 铜币 → 100 铜板
     1 银币 → 100 铜币
     1 金币 → 100 银币
     1 钻石币 → 100 金币

   即：向上换需要 110，向下换只得 100，每次兑换损耗 10%
   ============================================================ */

const CURRENCIES = [
    {
        id: 'copper',
        name: '铜板',
        icon: '🟤',
        level: 1,
        color: '#8d6e63',
        description: '最基础的货币，可用于购买低级作物和道具',
    },
    {
        id: 'copperCoin',
        name: '铜币',
        icon: '🟠',
        level: 2,
        color: '#e67e22',
        description: '中级货币，可用于购买中级作物',
    },
    {
        id: 'silver',
        name: '银币',
        icon: '⚪',
        level: 3,
        color: '#95a5a6',
        description: '高级货币，用于高级作物和道具',
    },
    {
        id: 'goldCoin',
        name: '金币',
        icon: '🟡',
        level: 4,
        color: '#f1c40f',
        description: '稀有货币，用于顶级作物和道具',
    },
    {
        id: 'diamond',
        name: '钻石币',
        icon: '💎',
        level: 5,
        color: '#3498db',
        description: '顶级货币，用于传说级物品',
    },
];

/* ============================================================
   查询
   ============================================================ */

/**
 * 根据 id 获取货币定义
 * @param {string} id
 * @returns {object|null}
 */
function getCurrencyById(id) {
    return CURRENCIES.find(c => c.id === id) || null;
}

/**
 * 根据等级获取货币定义（1-5）
 * @param {number} level
 * @returns {object|null}
 */
function getCurrencyByLevel(level) {
    return CURRENCIES.find(c => c.level === level) || null;
}

/**
 * 获取最低级货币（铜板）
 */
function getBaseCurrency() {
    return CURRENCIES[0];
}

/**
 * 获取最高级货币（钻石币）
 */
function getTopCurrency() {
    return CURRENCIES[CURRENCIES.length - 1];
}

/* ============================================================
   格式化
   ============================================================ */

/**
 * 格式化单个货币数值
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
 * 把总铜板数分解成各级货币
 * 使用 110 进制（与兑换规则一致）
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
 * 把分解结果格式化成显示字符串
 * @param {object} b   breakdownCopper() 的返回值
 * @param {object} opts { compact: bool }
 * @returns {string}
 */
function formatBreakdown(b, opts = {}) {
    const compact = opts.compact === true;
    const parts = [];

    if (b.diamond  > 0) parts.push(`${b.diamond} ${compact ? '💎' : '钻石币'}`);
    if (b.goldCoin > 0) parts.push(`${b.goldCoin} ${compact ? '🟡' : '金币'}`);
    if (b.silver   > 0) parts.push(`${b.silver} ${compact ? '⚪' : '银币'}`);
    if (b.copperCoin > 0) parts.push(`${b.copperCoin} ${compact ? '🟠' : '铜币'}`);
    if (b.copper   > 0 || parts.length === 0) {
        parts.push(`${b.copper} ${compact ? '🟤' : '铜板'}`);
    }

    return parts.join(' ');
}

/**
 * 综合格式化：根据当前设置自动选择单/多货币显示
 * @param {number} totalCopper
 * @returns {string}
 */
function formatCurrencyTotal(totalCopper) {
    /* 货币体系已统一为「金币」，不再做铜板/铜币/银币/金币/钻石币分级显示 */
    const amount = Math.max(0, Math.floor(totalCopper));
    return (typeof formatNumber === 'function' ? formatNumber(amount) : String(amount)) + ' 💰';
}

/* ============================================================
   换算
   ============================================================ */

/**
 * 把指定货币的数量换算成铜板（用于内部统一计算）
 * 使用"向下兑换"汇率（100:1），反映实际价值
 * @param {number} amount
 * @param {string} currencyId
 * @returns {number} 等价的铜板数
 */
function toCopper(amount, currencyId) {
    const cur = getCurrencyById(currencyId);
    if (!cur) return 0;
    const level = cur.level - 1; // 铜板 = 0 级
    return amount * Math.pow(CURRENCY_DOWN_RATE, level);
}

/**
 * 把铜板数换算成指定货币（不精确，用于预览）
 * @param {number} copper
 * @param {string} currencyId
 * @returns {number}
 */
function fromCopper(copper, currencyId) {
    const cur = getCurrencyById(currencyId);
    if (!cur) return 0;
    const level = cur.level - 1;
    return copper / Math.pow(CURRENCY_UP_RATE, level);
}

/* ============================================================
   兑换计算
   ============================================================ */

/**
 * 计算向上兑换需要多少低级货币
 * @param {number} targetAmount  想获得的上级货币数量
 * @param {string} targetId      上级货币 id
 * @returns {number} 需要的低级货币数量
 */
function calcUpgradeCost(targetAmount, targetId) {
    const cur = getCurrencyById(targetId);
    if (!cur || cur.level <= 1) return 0;
    return targetAmount * CURRENCY_UP_RATE;
}

/**
 * 计算向下兑换能获得多少低级货币
 * @param {number} sourceAmount  要兑换的上级货币数量
 * @param {string} sourceId      上级货币 id
 * @returns {number} 能获得的低级货币数量
 */
function calcDowngradeGain(sourceAmount, sourceId) {
    const cur = getCurrencyById(sourceId);
    if (!cur || cur.level <= 1) return 0;
    return sourceAmount * CURRENCY_DOWN_RATE;
}