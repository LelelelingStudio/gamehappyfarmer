/* ============================================================
   farmSystem.js  —  农田核心系统
   版本：v1.0.2

   地块状态机：
     locked  → empty  (buyLand)
     empty   → tilled (tillPlot)
     tilled  → planted (plantCrop)
     planted → tilled (harvestCrop / digPlant)
     planted ↔ sick  (随机事件 / curePlant)
   ============================================================ */

/* -------- 内部：安全记录统计 -------- */
function _safeRecordStat(key, value = 1, subKey = null) {
    if (typeof recordStat === 'function') {
        recordStat(key, value, subKey);
    }
}

/* -------- 土地价格：每次 +25%，向上取整 -------- */
function getLandPrice() {
    const idx = gameState.landPriceIndex;
    let price = Math.ceil(LAND_PRICE_BASE * Math.pow(LAND_PRICE_GROWTH, idx));
    /* 开垦折扣 */
    const discount = gameState.activeEffects.landDiscount || 0;
    if (discount > 0) {
        price = Math.ceil(price * (1 - discount));
    }
    return price;
}

/* -------- 购买新地 -------- */
function buyLand() {
    const price = getLandPrice();
    if (gameState.gold < price) {
        return { ok: false, reason: t('farm.errNeedGoldHave', { price, have: gameState.gold }) };
    }
    if (!spendGold(price)) {
        return { ok: false, reason: t('farm.errPayFailed') };
    }
    const newPlotId = gameState.ownedPlots;
    gameState.ownedPlots++;
    gameState.landPriceIndex++;

    setPlot(newPlotId, { state: 'empty', tilled: false });

    eventBus.emit(EVENTS.LAND_PURCHASED, { plotId: newPlotId, price });
    markDirty();
    if (typeof playSfx === 'function') playSfx('coin');
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true, plotId: newPlotId, price };
}

/* -------- 翻土 -------- */
function tillPlot(plotId) {
    if (plotId >= gameState.ownedPlots) {
        return { ok: false, reason: t('farm.errNotOwned') };
    }
    const plot = getPlot(plotId);
    if (plot.tilled) {
        return { ok: false, reason: t('farm.errAlreadyTilled') };
    }
    if (plot.state === 'planted' || plot.state === 'sick') {
        return { ok: false, reason: t('farm.errTilledOccupied') };
    }

    setPlot(plotId, { state: 'tilled', tilled: true });
    eventBus.emit(EVENTS.LAND_TILLED, { plotId });
    markDirty();
    if (typeof playSfx === 'function') playSfx('till');

    _safeRecordStat('tillCount');
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true };
}

/* -------- 种植 -------- */
function plantCrop(plotId, cropId, options = {}) {
    const secondHand = !!options.secondHand;
    const crop = (typeof getCropById === 'function') ? getCropById(cropId) : null;
    if (!crop) {
        return { ok: false, reason: t('farm.errNoCrop') };
    }
    if (gameState.level < crop.unlockLevel) {
        return { ok: false, reason: t('farm.errPlantLevel', { level: crop.unlockLevel }) };
    }
    if (plotId >= gameState.ownedPlots) {
        return { ok: false, reason: t('farm.errNotOwned') };
    }
    const plot = getPlot(plotId);
    if (!plot.tilled) {
        return { ok: false, reason: t('farm.errTillFirst') };
    }
    if (plot.state === 'planted' || plot.state === 'sick') {
        return { ok: false, reason: t('farm.errPlotOccupied') };
    }
    const seedName = crop.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子');
    const secondHandSeedName = seedName + '（二手）';

    if (secondHand) {
        if (getStorageCount(secondHandSeedName) <= 0) {
            return { ok: false, reason: t('farm.errNoSeed', { name: crop.name }) };
        }
        removeFromStorage(secondHandSeedName, 1);
    } else {
        if (getSeedCount(cropId) <= 0) {
            return { ok: false, reason: t('farm.errNoSeed', { name: crop.name }) };
        }
        consumeSeedCount(cropId, 1);
        removeFromStorage(seedName, 1);
    }

    setPlot(plotId, {
        state: 'planted',
        tilled: true,
        cropId: cropId,
        growthProgress: 0,
        watered: false,
        fertilizerStack: plot.fertilizerStack || 0,
        fertilizerBonus: plot.fertilizerBonus || 0,
        fertilizerDaysLeft: plot.fertilizerDaysLeft || 0,
        secondHand: secondHand,          /* 二手种子：长得慢、更易生病 */
        plantedAt: Date.now(),
    });

    eventBus.emit(EVENTS.CROP_PLANTED, { plotId, cropId });
    markDirty();
    if (typeof playSfx === 'function') playSfx('plant');

    _safeRecordStat('plantCount');
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true };
}

/* -------- 单块浇水 -------- */
function waterPlot(plotId) {
    const plot = getPlot(plotId);
    if (plot.state !== 'planted' && plot.state !== 'sick') {
        return { ok: false, reason: t('farm.errNoPlantHere') };
    }
    if (plot.watered) {
        return { ok: false, reason: t('farm.errAlreadyWatered') };
    }

    setPlot(plotId, { watered: true });
    eventBus.emit(EVENTS.CROP_WATERED, { plotId });
    markDirty();
    if (typeof playSfx === 'function') playSfx('water');

    _safeRecordStat('waterCount');
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true };
}

/* -------- 一键浇水 -------- */
function waterAllCrops() {
    if (gameState.gold < WATER_ALL_COST) {
        return { ok: false, reason: t('farm.errNeedGold', { cost: WATER_ALL_COST }) };
    }

    let count = 0;
    for (let i = 0; i < gameState.ownedPlots; i++) {
        const plot = getPlot(i);
        if ((plot.state === 'planted' || plot.state === 'sick') && !plot.watered) {
            setPlot(i, { watered: true });
            count++;
        }
    }

    if (count === 0) {
        return { ok: false, reason: t('farm.errNothingToWater') };
    }

    spendGold(WATER_ALL_COST);
    if (typeof playSfx === 'function') playSfx('water');
    markDirty();

    _safeRecordStat('waterCount', count);
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true, count };
}

/* -------- 单块收获 -------- */
function harvestCrop(plotId) {
    const plot = getPlot(plotId);
    if (plot.state !== 'planted') {
        return { ok: false, reason: t('farm.errNothingToHarvest') };
    }
    const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
    if (!crop) {
        return { ok: false, reason: t('farm.errCropData') };
    }
    if (plot.growthProgress < crop.growthTime) {
        return { ok: false, reason: t('farm.errNotMature') };
    }

    /* 丰收祝福：额外 +1 产出（仓库有位置时） */
    let yieldCount = 1;
    const blessed = !!(gameState.activeEffects && gameState.activeEffects.blessingOfHarvest);
    if (blessed && hasStorageSpace(2)) yieldCount = 2;

    if (!hasStorageSpace(yieldCount)) {
        return { ok: false, reason: t('farm.errStorageFull') };
    }

    addToStorage(crop.name, yieldCount, 1, {
        category: crop.category,
        icon: crop.icon,
        sellPrice: crop.sellPrice,
        unlockLevel: crop.unlockLevel,
    });

    /* 经验奖励：按售价 10% 计 */
    addExp(Math.max(1, Math.floor(crop.sellPrice / 5)));

    gameState.stats.totalHarvests += yieldCount;
    gameState.stats.harvestCount = (gameState.stats.harvestCount || 0) + 1;

    /* 成就统计 */
    _safeRecordStat('cropHarvestMap', 1, crop.name);
    _safeRecordStat('categoryHarvest', 1, crop.category);

    eventBus.emit(EVENTS.CROP_HARVESTED, { plotId, cropId: crop.id, name: crop.name, count: yieldCount });
    if (typeof playSfx === 'function') playSfx('harvest');

    /* 收获后地块回到「未翻土」的空地状态，需要重新翻土才能再种 */
    setPlot(plotId, {
        state: 'empty',
        tilled: false,
        cropId: null,
        growthProgress: 0,
        watered: false,
        fertilizerBonus: 0,
        fertilizerDaysLeft: 0,
        secondHand: false,
    });

    markDirty();
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true, crop, count: yieldCount };
}

/* -------- 一键收获 -------- */
function harvestAllCrops() {
    let count = 0;
    let totalValue = 0;
    for (let i = 0; i < gameState.ownedPlots; i++) {
        const plot = getPlot(i);
        if (plot.state !== 'planted') continue;
        const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
        if (!crop) continue;
        if (plot.growthProgress < crop.growthTime) continue;

        const r = harvestCrop(i);
        if (r.ok) {
            count++;
            totalValue += crop.sellPrice;
        }
    }
    if (count === 0) {
        return { ok: false, reason: t('farm.errNothingToHarvest') };
    }
    return { ok: true, count, totalValue };
}

/* -------- 治病 -------- */
function curePlant(plotId) {
    const plot = getPlot(plotId);
    if (plot.state !== 'sick') {
        return { ok: false, reason: t('farm.errNotSick') };
    }
    if (gameState.gold < CURE_PLANT_COST) {
        return { ok: false, reason: t('farm.errNeedGold', { cost: CURE_PLANT_COST }) };
    }
    spendGold(CURE_PLANT_COST);
    setPlot(plotId, { state: 'planted' });
    eventBus.emit(EVENTS.CROP_CURED, { plotId });
    markDirty();
    return { ok: true };
}

/* -------- 挖掉作物 -------- */
function digPlant(plotId) {
    const plot = getPlot(plotId);
    if (plot.state !== 'planted' && plot.state !== 'sick') {
        return { ok: false, reason: t('farm.errNoPlantHere') };
    }
    const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
    if (crop) {
        const refund = Math.floor(crop.price * DIG_PLANT_REFUND_RATIO);
        if (refund > 0) addGold(refund);
    }
    setPlot(plotId, {
        state: 'tilled',
        tilled: true,
        cropId: null,
        growthProgress: 0,
        watered: false,
    });
    eventBus.emit(EVENTS.CROP_DUG, { plotId });
    markDirty();

    _safeRecordStat('specialStats', 1, 'digCrops');
    if (typeof checkAchievements === 'function') checkAchievements();

    return { ok: true };
}

/* -------- 清理石子（预留） -------- */
function tryClearRocks(plotId) {
    const plot = getPlot(plotId);
    if (plot.state !== 'rock') {
        return { ok: false, reason: t('farm.errNoRock') };
    }
    if (gameState.gold < LAND_CLEAR_ROCK_COST) {
        return { ok: false, reason: t('farm.errNeedGold', { cost: LAND_CLEAR_ROCK_COST }) };
    }
    spendGold(LAND_CLEAR_ROCK_COST);
    setPlot(plotId, { state: 'empty', tilled: false });
    markDirty();
    return { ok: true };
}

/* -------- 施肥 -------- */
function fertilizePlot(plotId, fertilizer) {
    if (!fertilizer) return { ok: false, reason: t('farm.errNoFertilizer') };
    const plot = getPlot(plotId);
    if (plot.state !== 'planted' && plot.state !== 'sick') {
        return { ok: false, reason: t('farm.errNoPlantHere') };
    }
    if (getStorageCount(fertilizer.name) <= 0) {
        return { ok: false, reason: t('farm.errNoFertilizerInStorage') };
    }

    if (!removeFromStorage(fertilizer.name, 1)) {
        return { ok: false, reason: t('farm.errNoFertilizerInStorage') };
    }

    /* 二手肥料效果减半 */
    const weak = (gameState.inventory[fertilizer.name] || {}).weak;
    const ratio = typeof fertilizer.fertilityRatio === 'number' ? fertilizer.fertilityRatio : (weak ? 0.5 : 1);

    const patch = {};
    if (fertilizer.type === 'growthBoost' || fertilizer.growthBonus) {
        patch.fertilizerBonus = (plot.fertilizerBonus || 0) + (fertilizer.growthBonus || 0.1) * ratio;
    } else if (fertilizer.type === 'instantGrow') {
        const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
        if (crop) patch.growthProgress = crop.growthTime;
    } else {
        patch.fertilizerBonus = (plot.fertilizerBonus || 0) + 0.1 * ratio;
    }
    if (fertilizer.duration === 'days' && fertilizer.durationDays) {
        patch.fertilizerDaysLeft = fertilizer.durationDays;
    } else {
        patch.fertilizerDaysLeft = 0;
    }

    setPlot(plotId, patch);
    markDirty();
    if (typeof playSfx === 'function') playSfx('plant');
    return { ok: true };
}

function growCrops(days = 1) {
    const weatherMult = (typeof getWeatherGrowthMult === 'function') ? getWeatherGrowthMult() : 1.0;
    const seasonMult  = (typeof getSeasonGrowthMult  === 'function') ? getSeasonGrowthMult()  : 1.0;
    const baseMult    = weatherMult * seasonMult;

    for (let i = 0; i < gameState.ownedPlots; i++) {
        const plot = getPlot(i);
        if (plot.state !== 'planted') continue;

        const crop = (typeof getCropById === 'function') ? getCropById(plot.cropId) : null;
        if (!crop) continue;

        /* 生长倍率 */
        let mult = baseMult * (plot.tilled ? TILLED_GROWTH_MULT : UNTILLED_GROWTH_MULT);
        if (plot.watered) {
            mult += gameState.activeEffects.goldenWateringCan ? WATER_BONUS_GOLDEN : WATER_BONUS_NORMAL;
        }
        if (plot.fertilizerBonus) mult += plot.fertilizerBonus;
        /* 二手种子：生长速度打折 */
        if (plot.secondHand) mult *= (typeof SECOND_HAND_GROWTH_PENALTY === 'number') ? SECOND_HAND_GROWTH_PENALTY : 0.75;

        const delta = days * mult;
        let prog = (plot.growthProgress || 0) + delta;
        if (prog > crop.growthTime) prog = crop.growthTime;

        const patch = { growthProgress: prog };

        /* 魔法肥料剩余天数 */
        if (plot.fertilizerDaysLeft > 0) {
            const left = plot.fertilizerDaysLeft - days;
            if (left <= 0) {
                patch.fertilizerDaysLeft = 0;
                patch.fertilizerBonus = 0;
            } else {
                patch.fertilizerDaysLeft = left;
            }
        }

        setPlot(i, patch);
    }

    markDirty();
}

/* -------- 每天开始时重置 watered 标记 -------- */
function resetDailyFlags() {
    for (let i = 0; i < gameState.ownedPlots; i++) {
        const plot = getPlot(i);
        if (plot.watered) {
            setPlot(i, { watered: false });
        }
    }
}
/* ============================================================
   每日自动化（由商城道具解锁）
     - irrigationSystem：自动浇水（等同 autoWater，且额外 +1 生长进度概率）
     - autoWater       ：每天自动浇水
     - autoHarvest     ：自动收获成熟作物
     - autoPlant       ：在空着的已翻土地块自动种下手头有的种子
   由 nextDay() 调用，返回本日自动化摘要。
   ============================================================ */
function runFarmAutomation() {
    const eff = gameState.activeEffects || {};
    const summary = { watered: 0, harvested: 0, planted: 0 };

    /* 1. 自动浇水 */
    if (eff.autoWater || eff.irrigationSystem) {
        for (let i = 0; i < gameState.ownedPlots; i++) {
            const p = getPlot(i);
            if ((p.state === 'planted' || p.state === 'sick') && !p.watered) {
                setPlot(i, { watered: true });
                summary.watered++;
            }
        }
    }

    /* 2. 自动收获 */
    if (eff.autoHarvest) {
        for (let i = 0; i < gameState.ownedPlots; i++) {
            const p = getPlot(i);
            if (p.state !== 'planted') continue;
            const crop = (typeof getCropById === 'function') ? getCropById(p.cropId) : null;
            if (!crop || p.growthProgress < crop.growthTime) continue;
            if (!hasStorageSpace(2)) break;
            const r = harvestCrop(i);
            if (r.ok) summary.harvested++;
        }
    }

    /* 3. 自动种植：优先种仓库里种子数量最多的作物 */
    if (eff.autoPlant && typeof getSeedCount === 'function' && typeof plantCrop === 'function') {
        const seedIds = Object.keys(gameState.seeds || {})
            .map((id) => Number(id))
            .filter((id) => (Number(gameState.seeds[id]) || 0) > 0);
        if (seedIds.length > 0) {
            seedIds.sort((a, b) => (Number(gameState.seeds[b]) || 0) - (Number(gameState.seeds[a]) || 0));
            for (let i = 0; i < gameState.ownedPlots && seedIds.length > 0; i++) {
                const p = getPlot(i);
                if (p.state !== 'tilled' || p.cropId) continue;
                let planted = false;
                for (const cropId of seedIds) {
                    if ((Number(gameState.seeds[cropId]) || 0) <= 0) continue;
                    const r = plantCrop(i, cropId);
                    if (r && r.ok) { summary.planted++; planted = true; break; }
                }
                if (!planted) break;
            }
        }
    }

    if (summary.watered || summary.harvested || summary.planted) markDirty();
    return summary;
}
