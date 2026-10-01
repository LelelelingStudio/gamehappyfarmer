/* ============================================================
   fertilizers.js  —  5 种肥料定义
   版本：v1.0.1

   肥料作用：加速作物生长或直接成熟
   使用方式：点击种植中的地块 → 选择"施肥"
   使用后消耗 1 个肥料

   价格单位：铜板
   版本节奏：等级越高，解锁越强肥料
   ============================================================ */

const FERTILIZERS = [

    /* ===== 1. 普通肥料 ===== */
    {
        id: 'fertilizer_normal',
        name: '普通肥料',
        icon: '🌿',
        description: '基础的有机肥料，略微加速作物生长',
        type: 'growthBoost',              // 生长加速
        growthBonus: 0.10,                // +10% 生长速度
        duration: 'harvest',              // 持续 1 次收获
        maxStack: 1,                      // 不可叠加
        price: 50,                        // 50 铜板
        unlockLevel: 1,
        category: 'fertilizer',
    },

    /* ===== 2. 高效肥料 ===== */
    {
        id: 'fertilizer_advanced',
        name: '高效肥料',
        icon: '🌾',
        description: '经过浓缩的高效肥料，显著加速作物生长',
        type: 'growthBoost',
        growthBonus: 0.30,                // +30%
        duration: 'harvest',
        maxStack: 1,
        price: 150,
        unlockLevel: 5,
        category: 'fertilizer',
    },

    /* ===== 3. 有机肥料 ===== */
    {
        id: 'fertilizer_organic',
        name: '有机肥料',
        icon: '🍂',
        description: '纯天然的有机肥料，永久提升该地块肥力（最多叠加 2 层）',
        type: 'growthBoost',
        growthBonus: 0.20,                // +20%
        duration: 'permanent',            // 永久
        maxStack: FERTILIZER_ORGANIC_MAX_STACK,  // = 2 层上限
        price: 400,
        unlockLevel: 10,
        category: 'fertilizer',
    },

    /* ===== 4. 魔法肥料 ===== */
    {
        id: 'fertilizer_magic',
        name: '魔法肥料',
        icon: '✨',
        description: '蕴含魔法的肥料，短期内大幅加速（持续 3 天）',
        type: 'growthBoost',
        growthBonus: 0.50,                // +50%
        duration: 'days',                 // 持续 N 天
        durationDays: 3,                  // 3 天
        maxStack: 1,                      // 同地块不可叠
        price: 1000,
        unlockLevel: 20,
        category: 'fertilizer',
    },

    /* ===== 5. 传奇肥料 ===== */
    {
        id: 'fertilizer_legendary',
        name: '传奇肥料',
        icon: '🌟',
        description: '传说中的神器肥料，立即让作物成熟',
        type: 'instant',                  // 立即成熟
        duration: 'consumable',           // 一次性
        maxStack: 1,
        price: 3000,
        unlockLevel: 30,
        category: 'fertilizer',
    },
];

/* ============================================================
   查询辅助
   ============================================================ */

/**
 * 根据 id 获取肥料
 */
function getFertilizerById(id) {
    return FERTILIZERS.find(f => f.id === id) || null;
}

/**
 * 获取玩家当前等级可用的肥料列表
 * @param {number} level
 * @returns {array}
 */
function getAvailableFertilizers(level) {
    return FERTILIZERS.filter(f => level >= f.unlockLevel);
}

/**
 * 获取肥料在仓库里的名字（用于 inventory 查找）
 */
function getFertilizerInventoryName(fertilizer) {
    return fertilizer ? fertilizer.name : '';
}

/**
 * 判断某地块是否可以使用某肥料
 * @param {number} plotId
 * @param {object} fertilizer
 * @returns {object} { ok: boolean, reason: string }
 */
function canApplyFertilizer(plotId, fertilizer) {
    if (!fertilizer) return { ok: false, reason: '肥料不存在' };

    const plot = getPlot(plotId);

    /* 必须有作物在种 */
    if (plot.state !== 'planted' && plot.state !== 'sick') {
        return { ok: false, reason: '该地块没有种植作物' };
    }

    /* 生病的地块不能施肥（要先治病）*/
    if (plot.state === 'sick') {
        return { ok: false, reason: '作物生病了，请先治疗' };
    }

    /* 已成熟的作物不需要施肥 */
    const crop = getCropById(plot.cropId);
    if (crop && plot.growthProgress >= crop.growthTime) {
        return { ok: false, reason: '作物已经成熟，无需施肥' };
    }

    /* 检查库存 */
    if (!gameState.inventory[fertilizer.name] ||
        gameState.inventory[fertilizer.name].count <= 0) {
        return { ok: false, reason: '仓库里没有这种肥料' };
    }

    /* 检查叠加上限 */
    if (fertilizer.duration === 'permanent') {
        const currentStack = (plot.fertilizerStack || 0);
        if (currentStack >= fertilizer.maxStack) {
            return { ok: false, reason: `该地块有机肥料已达上限（${fertilizer.maxStack} 层）` };
        }
    }

    return { ok: true, reason: '' };
}