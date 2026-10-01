/* ============================================================
   weatherSystem.js  —  天气与季节
   版本：v1.0.1
   ============================================================ */

/* -------- 初始化 -------- */
function initWeather() {
    if (!gameState.weather)     gameState.weather = '晴朗';
    if (!gameState.nextWeather) gameState.nextWeather = rollWeather();
    if (!gameState.season)      gameState.season = '春季';
    if (!gameState.seasonDay)   gameState.seasonDay = 1;
}

/* -------- 按权重抽一个天气 -------- */
function rollWeather() {
    const total = WEATHER_ROLL.reduce((sum, w) => sum + w.weight, 0);
    let roll = Math.random() * total;
    for (const w of WEATHER_ROLL) {
        roll -= w.weight;
        if (roll <= 0) return w.type;
    }
    return WEATHER_ROLL[WEATHER_ROLL.length - 1].type;
}

/* -------- 生长倍率 -------- */
function getWeatherGrowthMult() {
    /* 温室取消恶劣天气的生长惩罚 */
    if (gameState.activeEffects && gameState.activeEffects.greenhouse) {
        return Math.max(1.0, WEATHER_GROWTH_MULT[gameState.weather] || 1.0);
    }
    return WEATHER_GROWTH_MULT[gameState.weather] || 1.0;
}

function getSeasonGrowthMult() {
    switch (gameState.season) {
        case '春季': return 1.1;
        case '夏季': return 1.0;
        case '秋季': return 1.0;
        case '冬季': return 0.8;
        default:     return 1.0;
    }
}

function getTotalGrowthMult() {
    return getWeatherGrowthMult() * getSeasonGrowthMult();
}

/* -------- 推进一天 -------- */
function advanceWeather() {
    const eff = gameState.activeEffects || {};

    gameState.weather     = gameState.nextWeather || rollWeather();
    gameState.nextWeather = rollWeather();

    /* 天气控制道具生效期间，始终晴天 */
    if (eff.weatherControl) {
        gameState.weather = '晴朗';
        gameState.nextWeather = '晴朗';
    } else if (eff.greenhouse) {
        /* 温室：下一天不会出现暴风雨 */
        const bad = (gameState.nextWeather === '暴风雨' || gameState.nextWeather === '大雨');
        if (bad) gameState.nextWeather = '小雨';
    }

    gameState.seasonDay++;
    if (gameState.seasonDay > SEASON_LENGTH_DAYS) {
        gameState.seasonDay = 1;
        const idx = SEASONS.indexOf(gameState.season);
        gameState.season = SEASONS[(idx + 1) % SEASONS.length];
        eventBus.emit(EVENTS.SEASON_CHANGED, gameState.season);
    }

    markDirty();
    eventBus.emit(EVENTS.WEATHER_CHANGED, {
        weather: gameState.weather,
        next: gameState.nextWeather,
        season: gameState.season,
    });
}