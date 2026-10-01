/* ============================================================
   eventBus.js  —  事件总线（系统间解耦通信）
   版本：v1.0.1

   用途：
     - 系统层之间不直接互相调用，改为 emit 事件
     - UI 层订阅事件，被动刷新
     - 便于以后扩展新系统（寄卖、拍卖、成就……）

   基础用法：
     eventBus.on('crop:harvested', (data) => { ... });
     eventBus.emit('crop:harvested', { cropId: 1, count: 3 });
     eventBus.off('crop:harvested', handler);
     eventBus.once('game:dayChanged', (day) => { ... });
   ============================================================ */

const eventBus = {

    /* -------- 内部：事件 → 监听器数组 -------- */
    _listeners: {},

    /* -------- 内部：调试开关 -------- */
    _debug: false,

    /* ============================================================
       订阅
       ============================================================ */

    /**
     * 订阅事件
     * @param {string} event
     * @param {Function} handler
     * @returns {Function} 取消订阅的函数
     */
    on(event, handler) {
        if (typeof event !== 'string' || typeof handler !== 'function') {
            console.warn('[eventBus] on: 参数错误', event, handler);
            return () => {};
        }
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(handler);

        if (this._debug) {
            console.log(`[eventBus] on: ${event}（共 ${this._listeners[event].length} 个监听）`);
        }

        /* 返回取消订阅的便捷函数 */
        return () => this.off(event, handler);
    },

    /**
     * 订阅一次，触发后自动取消
     * @param {string} event
     * @param {Function} handler
     * @returns {Function}
     */
    once(event, handler) {
        if (typeof event !== 'string' || typeof handler !== 'function') {
            console.warn('[eventBus] once: 参数错误', event, handler);
            return () => {};
        }
        const wrapper = (...args) => {
            this.off(event, wrapper);
            try {
                handler(...args);
            } catch (e) {
                console.error(`[eventBus] once handler 出错: ${event}`, e);
            }
        };
        return this.on(event, wrapper);
    },

    /* ============================================================
       取消订阅
       ============================================================ */

    /**
     * 取消订阅
     * @param {string} event
     * @param {Function} [handler] 不传则清空该事件的所有监听
     */
    off(event, handler) {
        if (!this._listeners[event]) return;

        if (!handler) {
            delete this._listeners[event];
            if (this._debug) console.log(`[eventBus] off: 清空 ${event} 的所有监听`);
            return;
        }

        const arr = this._listeners[event];
        const idx = arr.indexOf(handler);
        if (idx > -1) {
            arr.splice(idx, 1);
            if (this._debug) console.log(`[eventBus] off: ${event}`);
        }

        /* 数组空了就删掉，避免内存泄漏 */
        if (arr.length === 0) delete this._listeners[event];
    },

    /* ============================================================
       触发
       ============================================================ */

    /**
     * 触发事件
     * @param {string} event
     * @param {...any} args
     * @returns {number} 成功执行的 handler 数量
     */
    emit(event, ...args) {
        const arr = this._listeners[event];
        if (!arr || arr.length === 0) {
            if (this._debug) console.log(`[eventBus] emit: ${event}（无监听）`);
            return 0;
        }

        /* 拷贝一份，防止 handler 内部 on/off 修改原数组导致遍历异常 */
        const handlers = arr.slice();
        let okCount = 0;

        for (const handler of handlers) {
            try {
                handler(...args);
                okCount++;
            } catch (e) {
                /* 单个 handler 出错不影响其他 handler */
                console.error(`[eventBus] handler 出错: ${event}`, e);
            }
        }

        if (this._debug) {
            console.log(`[eventBus] emit: ${event}（${okCount}/${handlers.length} 成功）`, args);
        }
        return okCount;
    },

    /* ============================================================
       清空
       ============================================================ */

    /**
     * 清空某事件的所有监听
     */
    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    },

    /**
     * 清空所有监听（新游戏 / 重置时调用）
     */
    clearAll() {
        this._listeners = {};
    },

    /* ============================================================
       状态查询
       ============================================================ */

    /**
     * 某事件的监听数量
     */
    listenerCount(event) {
        return this._listeners[event] ? this._listeners[event].length : 0;
    },

    /**
     * 所有已注册的事件名
     */
    eventNames() {
        return Object.keys(this._listeners);
    },

    /* ============================================================
       调试
       ============================================================ */

    /**
     * 打开 / 关闭调试日志
     */
    setDebug(on) {
        this._debug = !!on;
    },
};

/* ============================================================
   事件名常量（统一管理，防止拼写错误）
   ============================================================ */

const EVENTS = {

    /* -------- 游戏流程 -------- */
    GAME_INIT:           'game:init',
    GAME_LOADED:         'game:loaded',
    GAME_RESET:          'game:reset',
    DAY_CHANGED:         'game:dayChanged',
    STATE_DIRTY:         'game:stateDirty',

    /* -------- 农场 -------- */
    CROP_PLANTED:        'crop:planted',
    CROP_WATERED:        'crop:watered',
    CROP_HARVESTED:      'crop:harvested',
    CROP_SICK:           'crop:sick',
    CROP_CURED:          'crop:cured',
    CROP_DUG:            'crop:dug',
    LAND_PURCHASED:      'land:purchased',
    LAND_TILLED:         'land:tilled',

    /* -------- 经济 -------- */
    GOLD_GAINED:         'economy:goldGained',
    GOLD_SPENT:          'economy:goldSpent',
    EXP_GAINED:          'economy:expGained',
    LEVEL_UP:            'economy:levelUp',
    STORAGE_CHANGED:     'economy:storageChanged',
    STORAGE_UPGRADED:    'economy:storageUpgraded',

    /* -------- 天气 / 季节 -------- */
    WEATHER_CHANGED:     'weather:changed',
    SEASON_CHANGED:      'season:changed',

    /* -------- 加工厂 -------- */
    FACTORY_STARTED:     'factory:started',
    FACTORY_DONE:        'factory:done',
    FACTORY_COLLECTED:   'factory:collected',

    /* -------- 商人 -------- */
    MERCHANT_ARRIVED:    'merchant:arrived',
    MERCHANT_LEFT:       'merchant:left',
    MERCHANT_SOLD:       'merchant:sold',

    /* -------- 商城 -------- */
    MALL_ITEM_BOUGHT:    'mall:itemBought',
    MALL_ITEM_USED:      'mall:itemUsed',

    /* -------- 皮肤 -------- */
    SKIN_UNLOCKED:       'skin:unlocked',
    SKIN_CHANGED:        'skin:changed',

    /* -------- 成就 -------- */
    ACHIEVEMENT_UNLOCKED:'achievement:unlocked',

    /* -------- 寄卖 -------- */
    CONSIGN_LISTED:      'consign:listed',
    CONSIGN_SOLD:        'consign:sold',
    CONSIGN_EXPIRED:     'consign:expired',

    /* -------- 拍卖 -------- */
    AUCTION_STARTED:     'auction:started',
    AUCTION_BID:         'auction:bid',
    AUCTION_ENDED:       'auction:ended',

    /* -------- 货币 -------- */
    CURRENCY_EXCHANGED:  'currency:exchanged',

    /* -------- 事件系统 -------- */
    RANDOM_EVENT:        'event:random',
    NOTIFICATION:        'ui:notification',
    LOG_ADDED:           'ui:logAdded',
};