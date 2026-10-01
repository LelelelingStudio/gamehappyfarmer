/* ============================================================
   layout.js  —  4 版布局检测
   判定规则（auto 模式）：
     - 宽度 < 600px                     → mobile（手机竖屏 / 窄屏）
     - 宽度 ≥ 1024 且 宽 > 高           → desktop（电脑）
     - 600 ≤ 宽度 < 1024 且 宽 > 高      → wide-short（横屏手机 / iPad 横屏）
     - 宽度 ≥ 600 且 高 > 宽             → tall-narrow（iPad 竖屏 / 平板竖屏）
   用户可在设置里强制 desktop / mobile
   版本：v1.0.1
   ============================================================ */

const layout = {

    /* -------- 当前布局 -------- */
    _current: 'desktop',

    /* -------- resize 防抖 -------- */
    _resizeHandler: null,

    /* ============================================================
       初始化
       ============================================================ */
    init() {
        /* 首次判定 */
        this.apply();

        /* resize 监听（防抖）*/
        this._resizeHandler = debounce(() => this.apply(), RESIZE_DEBOUNCE_MS);
        window.addEventListener('resize', this._resizeHandler);

        /* 屏幕旋转（移动端）*/
        window.addEventListener('orientationchange', () => {
            /* orientationchange 有延迟，等 300ms 后再算 */
            setTimeout(() => this.apply(), 300);
        });
    },

    /* ============================================================
       判定并应用
       ============================================================ */
    apply() {
        const next = this._decide();

        if (next === this._current && document.documentElement.classList.contains(`layout-${next}`)) {
            /* 没变化，跳过 */
            return;
        }

        this._current = next;
        this._applyClass(next);

        /* 通知其他模块（如有需要）*/
        if (typeof onLayoutChange === 'function') {
            try { onLayoutChange(next); } catch (e) { /* 忽略 */ }
        }
    },

    /* ============================================================
       内部：决定用哪个布局
       ============================================================ */
    _decide() {
        /* 用户在设置里强制 */
        const mode = gameState.settings ? gameState.settings.displayMode : 'auto';

        if (mode === 'desktop') return 'desktop';
        if (mode === 'mobile')  return 'mobile';

        /* auto：按屏幕判断 */
        const w = window.innerWidth;
        const h = window.innerHeight;
        const isPortrait = h > w;

        /* 1. 窄屏强制移动版 */
        if (w < LAYOUT_MOBILE_MAX_WIDTH) {
            return 'mobile';
        }

        /* 2. 横屏且宽够 */
        if (!isPortrait) {
            if (w >= LAYOUT_DESKTOP_MIN_WIDTH) return 'desktop';
            return 'wide-short';
        }

        /* 3. 竖屏且宽 ≥ 600 */
        return 'tall-narrow';
    },

    /* ============================================================
       内部：给 <html> 加类
       ============================================================ */
    _applyClass(name) {
        const html = document.documentElement;
        /* 移除所有 layout-* 类 */
        html.classList.forEach((cls) => {
            if (cls.startsWith('layout-')) html.classList.remove(cls);
        });
        /* 加新的 */
        html.classList.add(`layout-${name}`);
    },

    /* ============================================================
       设置面板调用
       ============================================================ */

    /**
     * 设置显示模式
     * @param {string} mode 'auto' | 'desktop' | 'mobile'
     */
    setMode(mode) {
        if (!['auto', 'desktop', 'mobile'].includes(mode)) mode = 'auto';
        gameState.settings.displayMode = mode;
        this.apply();
    },

    /* ============================================================
       状态查询
       ============================================================ */

    /**
     * 获取当前布局名
     * @returns {string} 'desktop' | 'mobile' | 'wide-short' | 'tall-narrow'
     */
    getCurrent() {
        return this._current;
    },

    /**
     * 是否移动端布局
     */
    isMobile() {
        return this._current === 'mobile';
    },

    /**
     * 是否桌面布局
     */
    isDesktop() {
        return this._current === 'desktop';
    },
};