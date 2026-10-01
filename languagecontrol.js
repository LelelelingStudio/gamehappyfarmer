(function () {
    const FALLBACK_LANGUAGE = 'zh';

    /* 法定文档（规则 / 隐私政策 / 服务条款）以 JS 内联形式随 index.html 静态加载，
       这里登记成表，供 legalDialog.js / settingsUI.js 按当前语言取用。 */
    window.DOCUMENT_PACKS = window.DOCUMENT_PACKS || {};
    if (typeof DOCUMENTS_CH !== 'undefined' && !window.DOCUMENT_PACKS.zh) {
        window.DOCUMENT_PACKS.zh = DOCUMENTS_CH;
    }
    if (typeof DOCUMENTS_EN !== 'undefined' && !window.DOCUMENT_PACKS.en) {
        window.DOCUMENT_PACKS.en = DOCUMENTS_EN;
    }

    /* 数据文件加载顺序（不含 ui / 不含 constants；ui 在 HTML 中直接加载；constants 是语言无关的，在 HTML 中同步加载） */
    const DATA_FILES = [
        'currencies',
        'crops_vegetable', 'crops_fruit', 'crops_grain', 'crops_medicine', 'crops_flower',
        'crops_tropical', 'crops_mushroom', 'crops_spice', 'crops_magic', 'crops_legend',
        'index',
        'factoryproducts_1', 'factoryproducts_2', 'factoryproducts_3', 'factoryproducts_4', 'factoryproducts_5',
        'mallItems', 'skins', 'achievements', 'events', 'merchants', 'fertilizers',
    ];

    function normalizeLocaleKey(value) {
        if (!value) return null;
        const raw = String(value).trim().toLowerCase();
        if (!raw || raw === 'auto') return null;
        if (raw.startsWith('zh')) return 'zh';
        if (raw.startsWith('en')) return 'en';
        return raw.split('-')[0] || null;
    }

    function getBrowserLocaleKey() {
        const browserLocale = typeof navigator !== 'undefined'
            ? (navigator.language || (navigator.languages && navigator.languages[0]) || 'zh-CN')
            : 'zh-CN';
        return normalizeLocaleKey(browserLocale) || FALLBACK_LANGUAGE;
    }

    function ensureLanguagePacks() {
        window.LANG_PACKS = window.LANG_PACKS || {};
        if (typeof LANG_CH !== 'undefined' && !window.LANG_PACKS.zh) {
            window.LANG_PACKS.zh = LANG_CH;
        }
        if (typeof LANG_EN !== 'undefined' && !window.LANG_PACKS.en) {
            window.LANG_PACKS.en = LANG_EN;
        }
        if (!window.LANG_PACKS.zh && typeof LANG_CH !== 'undefined') {
            window.LANG_PACKS.zh = LANG_CH;
        }
        if (!window.LANG_PACKS.en && typeof LANG_EN !== 'undefined') {
            window.LANG_PACKS.en = LANG_EN;
        }
        if (!window.LANG_PACKS.zh) {
            window.LANG_PACKS.zh = {};
        }

        /* 把 messages-<locale>.js（系统消息）合并进对应语言包。
           只补齐不覆盖：ui-<locale>.js 里已有的键优先，避免误伤界面文案。 */
        if (typeof MESSAGES_CH !== 'undefined') mergeMessages(window.LANG_PACKS.zh, MESSAGES_CH);
        if (typeof MESSAGES_EN !== 'undefined') mergeMessages(window.LANG_PACKS.en, MESSAGES_EN);
    }

    /* 递归补齐：extra 中 base 没有的键才会写入 */
    function mergeMessages(base, extra) {
        if (!base || !extra) return base;
        for (const key of Object.keys(extra)) {
            const b = base[key];
            const e = extra[key];
            if (b && typeof b === 'object' && e && typeof e === 'object') {
                mergeMessages(b, e);
            } else if (!(key in base)) {
                base[key] = e;
            }
        }
        return base;
    }

    function getTargetLocaleKey(locale) {
        ensureLanguagePacks();
        const normalized = normalizeLocaleKey(locale) || getBrowserLocaleKey();
        if (window.LANG_PACKS[normalized]) return normalized;
        if (normalized === 'en' && window.LANG_PACKS.zh) return 'zh';
        if (normalized === 'zh' && window.LANG_PACKS.en) return 'en';
        return FALLBACK_LANGUAGE;
    }

    function resolveCurrentLocaleKey() {
        const selected = (typeof gameState !== 'undefined' && gameState.settings)
            ? (gameState.settings.language || 'auto')
            : 'auto';

        /* auto 时优先用语言偏好标记：数据文件就是按它加载的，
           否则会出现「数据是英文、界面是中文」这种不一致。 */
        if (selected === 'auto') {
            const pref = getStoredLanguagePreference();
            if (pref && pref !== 'auto') return getTargetLocaleKey(pref);
            return getTargetLocaleKey(getBrowserLocaleKey());
        }
        return getTargetLocaleKey(selected);
    }

    function getPackByLocale(localeKey) {
        ensureLanguagePacks();
        const key = getTargetLocaleKey(localeKey);
        return window.LANG_PACKS[key] || window.LANG_PACKS[FALLBACK_LANGUAGE] || {};
    }

    function getValueByPath(target, key) {
        if (!target || typeof target !== 'object') return undefined;
        return key.split('.').reduce((current, segment) => {
            if (!current || typeof current !== 'object') return undefined;
            return Object.prototype.hasOwnProperty.call(current, segment) ? current[segment] : undefined;
        }, target);
    }

    function interpolateTemplate(value, params = {}) {
        return String(value).replace(/\{(\w+)\}/g, (_, name) => {
            const data = params[name];
            return data == null ? '' : String(data);
        });
    }

    /* 把可能的非字符串值安全转换为字符串，避免显示 [object Object] */
    function safeToString(value, fallback) {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object') {
            try { return JSON.stringify(value); } catch (e) { /* fall through */ }
        }
        return fallback || '';
    }

    function translate(key, params = {}) {
        const localeKey = resolveCurrentLocaleKey();
        const primaryPack = getPackByLocale(localeKey);
        const fallbackPack = getPackByLocale(FALLBACK_LANGUAGE);

        let value = getValueByPath(primaryPack, key);
        if (typeof value !== 'string') {
            value = getValueByPath(fallbackPack, key);
        }
        /* 如果两个包都没有命中，输出空串（避免出现原始 key 路径如 "ui.foo.bar"） */
        if (typeof value !== 'string') return '';
        return interpolateTemplate(value, params);
    }

    /* 加载单个脚本，返回 Promise */
    function getBasePath() {
        const path = window.location.pathname;
        // If the path ends with .html, remove the filename
        if (path.endsWith('.html')) {
            return path.substring(0, path.lastIndexOf('/') + 1);
        }
        // Otherwise, assume it's a directory
        return path.endsWith('/') ? path : path + '/';
    }

    /* 加载单个脚本，返回 Promise */
    function loadScriptTag(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            // Prepend base path to the src
            const fullSrc = getBasePath() + src + (typeof GAME_VERSION !== 'undefined' ? ('?v=' + GAME_VERSION) : '');
            s.src = fullSrc;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load ' + fullSrc));
            document.head.appendChild(s);
        });
    }

    /* locale → 数据目录名（中文包目录名是 ch/ 而不是 zh/） */
    function localeFolder(tag) {
        return tag === 'zh' ? 'ch' : tag;
    }

    /* 按顺序加载指定 locale 的所有数据文件；可多次调用以覆盖（最新一次生效） */
    async function loadDataPack(locale) {
        const tag = normalizeLocaleKey(locale) || FALLBACK_LANGUAGE;
        const folder = localeFolder(tag);
        for (const base of DATA_FILES) {
            await loadScriptTag(`langdata/${folder}/${base}-${folder}.js`);
        }
        window.currentDataLocale = tag;
        return tag;
    }

    /* ============================================================
       语言偏好（与存档解耦的小标记）
       切语言时先写这个 key 再刷新页面：即使存档写入失败，
       刷新后仍能加载正确语言的数据文件并与设置保持一致。
       ============================================================ */
    const LANG_PREF_KEY = 'farm_lang_pref';

    function getStoredLanguagePreference() {
        try {
            const v = localStorage.getItem(LANG_PREF_KEY);
            if (v === 'zh' || v === 'en' || v === 'auto') return v;
        } catch (e) { /* ignore */ }
        return null;
    }

    function setStoredLanguagePreference(value) {
        try {
            localStorage.setItem(LANG_PREF_KEY, value === 'en' ? 'en' : (value === 'zh' ? 'zh' : 'auto'));
        } catch (e) { /* ignore */ }
    }

    /* 启动时把偏好同步进 gameState.settings.language（显式偏好优先） */
    function syncLanguagePreference() {
        const pref = getStoredLanguagePreference();
        if (!pref) return;
        if (typeof gameState === 'undefined' || !gameState.settings) return;
        if (gameState.settings.language !== pref) {
            gameState.settings.language = pref;
        }
    }

    /* 根据存档设置获取本次启动应当使用的 locale（用于动态加载数据文件） */
    function resolveInitialDataLocale() {
        /* 0. 语言偏好标记优先（切语言刷新时最可靠） */
        const pref = getStoredLanguagePreference();
        if (pref === 'zh' || pref === 'en') return pref;

        try {
            /* 1. 其次从存档读取 */
            const saveRaw = localStorage.getItem(typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'farm_game_save_v1');
            if (saveRaw) {
                const parsed = JSON.parse(saveRaw);
                const lang = parsed && parsed.settings && parsed.settings.language;
                if (lang === 'zh' || lang === 'en') return lang;
                if (!lang || lang === 'auto') return getBrowserLocaleKey();
            }
        } catch (e) { /* ignore */ }
        return getBrowserLocaleKey();
    }

    /* ============================================================
       存档名称迁移（跨语言）
       存档里 inventory / 寄卖 / 拍卖 / 收获统计都以"本地化名称"为 key。
       切换语言后需要把这些 key 从旧语言名称改成新语言名称，
       否则英文模式下旧中文条目会失联（无法出售 / 寄卖 / 触发成就）。
       ============================================================ */

    /* 从当前已加载的全局数据收集 id→名称 映射（当前 locale） */
    function collectCurrentLocaleMaps() {
        const maps = { crops: [], factory: [], fertilizers: [], mall: [], seedSuffix: '', tillMachine: '' };
        try {
            if (typeof CROPS_ALL !== 'undefined' && Array.isArray(CROPS_ALL)) {
                maps.crops = CROPS_ALL.map(c => ({ id: c.id, name: c.name }));
            }
            if (typeof FACTORY_PRODUCTS_ALL !== 'undefined' && Array.isArray(FACTORY_PRODUCTS_ALL)) {
                maps.factory = FACTORY_PRODUCTS_ALL.map(p => ({ id: p.id, name: p.name }));
            }
            if (typeof FERTILIZERS !== 'undefined' && Array.isArray(FERTILIZERS)) {
                maps.fertilizers = FERTILIZERS.map(f => ({ id: f.id, name: f.name }));
            }
            if (typeof MALL_ITEMS !== 'undefined' && Array.isArray(MALL_ITEMS)) {
                maps.mall = MALL_ITEMS.map(m => ({ id: m.id, name: m.name }));
            }
            maps.seedSuffix = (typeof SEED_NAME_SUFFIX !== 'undefined') ? SEED_NAME_SUFFIX : '';
            maps.tillMachine = (typeof TILL_MACHINE_ITEM_NAME !== 'undefined') ? TILL_MACHINE_ITEM_NAME : '';
        } catch (e) { /* ignore */ }
        return maps;
    }

    /* 取出指定 locale 的 id→名称 对照表。
       以前是 fetch 全部数据文件再 eval，在 file:// 下会被 CORS 拦死；
       现在改为注入 namemap-<locale>.js（普通脚本，file:// 也能加载）。 */
    const NAME_MAP_GLOBALS = { zh: 'NAME_MAP_CH', en: 'NAME_MAP_EN' };

    async function fetchLocaleMaps(tag) {
        const folder = localeFolder(tag);
        const globalName = NAME_MAP_GLOBALS[tag] || ('NAME_MAP_' + String(tag).toUpperCase());

        if (typeof globalThis[globalName] === 'undefined') {
            /* loadScriptTag 内部会自己拼 basePath */
            await loadScriptTag(`langdata/${folder}/namemap-${folder}.js`);
        }

        const raw = globalThis[globalName];
        if (!raw) throw new Error('namemap not available for ' + tag);

        const toPairs = (list) => (Array.isArray(list) ? list.map((e) => ({ id: e[0], name: e[1] })) : []);
        return {
            crops: toPairs(raw.crops),
            factory: toPairs(raw.factory),
            fertilizers: toPairs(raw.fertilizers),
            mall: toPairs(raw.mall),
            seedSuffix: raw.seedSuffix || '',
            tillMachine: raw.tillMachine || '',
        };
    }

    /* 由 旧locale映射 + 新locale映射 生成 旧名称→新名称 的改名表 */
    function buildRenameMap(oldMaps, newMaps) {
        const rename = {};
        const byId = (list) => { const m = new Map(); for (const e of list) m.set(e.id, e.name); return m; };

        /* 作物 + 种子（种子 = 作物名 + 后缀） */
        const newCrops = byId(newMaps.crops);
        for (const c of oldMaps.crops) {
            const n = newCrops.get(c.id);
            if (n == null) continue;
            if (n !== c.name) rename[c.name] = n;
            const oldSeed = c.name + oldMaps.seedSuffix;
            const newSeed = n + newMaps.seedSuffix;
            if (oldSeed !== newSeed) rename[oldSeed] = newSeed;
        }

        /* 加工品 */
        const newFactory = byId(newMaps.factory);
        for (const p of oldMaps.factory) {
            const n = newFactory.get(p.id);
            if (n != null && n !== p.name) rename[p.name] = n;
        }

        /* 肥料（仓库名 = 肥料 name） */
        const newFerts = byId(newMaps.fertilizers);
        for (const f of oldMaps.fertilizers) {
            const n = newFerts.get(f.id);
            if (n != null && n !== f.name) rename[f.name] = n;
        }

        /* 商城道具（购买后进仓库） */
        const newMall = byId(newMaps.mall);
        for (const m of oldMaps.mall) {
            const n = newMall.get(m.id);
            if (n != null && n !== m.name) rename[m.name] = n;
        }

        /* 特殊道具：翻土机 */
        if (oldMaps.tillMachine && newMaps.tillMachine && oldMaps.tillMachine !== newMaps.tillMachine) {
            rename[oldMaps.tillMachine] = newMaps.tillMachine;
        }
        return rename;
    }

    /* 把改名表应用到 gameState */
    function applyRenameToGameState(rename) {
        if (!rename || Object.keys(rename).length === 0) return false;
        let changed = false;

        /* 仓库：重命名 key（目标已存在则合并数量） */
        const inv = gameState.inventory;
        if (inv) {
            for (const key of Object.keys(inv)) {
                const nk = rename[key];
                if (!nk || nk === key) continue;
                if (inv[nk]) {
                    inv[nk].count = (inv[nk].count || 0) + (inv[key].count || 0);
                } else {
                    inv[nk] = inv[key];
                    inv[nk].name = nk;
                }
                delete inv[key];
                changed = true;
            }
        }

        /* 寄卖 */
        for (const c of (gameState.consignments || [])) {
            if (rename[c.itemName]) { c.itemName = rename[c.itemName]; changed = true; }
        }

        /* 拍卖 */
        const a = gameState.auction && gameState.auction.active;
        if (a && rename[a.itemName]) { a.itemName = rename[a.itemName]; changed = true; }

        /* 成就统计：按作物名计数 */
        const chm = gameState.stats && gameState.stats.cropHarvestMap;
        if (chm) {
            const remapped = {};
            let statChanged = false;
            for (const k of Object.keys(chm)) {
                const nk = rename[k] || k;
                if (nk !== k) statChanged = true;
                remapped[nk] = (remapped[nk] || 0) + chm[k];
            }
            if (statChanged) { gameState.stats.cropHarvestMap = remapped; changed = true; }
        }
        return changed;
    }

    /**
     * 启动时（loadGame 之后）调用：
     * 若存档里的名称 locale（settings.dataLocale）与当前加载的数据 locale 不一致，
     * 抓取旧 locale 的数据建立改名表并迁移存档名称。
     * 返回 Promise<boolean>：是否实际改了名（改了名建议刷新一次界面）。
     */
    async function migrateSaveNamesIfNeeded() {
        if (typeof gameState === 'undefined' || !gameState || !gameState.settings) return false;

        const current = window.currentDataLocale || FALLBACK_LANGUAGE;
        /* 旧版存档没有 dataLocale 字段——旧版构建数据文件永远硬编码中文包，名称按中文处理 */
        const old = gameState.settings.dataLocale || 'zh';

        if (old !== current) {
            const hasNamedData = Object.keys(gameState.inventory || {}).length > 0
                || (gameState.consignments || []).length > 0
                || !!(gameState.auction && gameState.auction.active)
                || !!(gameState.stats && gameState.stats.cropHarvestMap && Object.keys(gameState.stats.cropHarvestMap).length > 0);
            if (hasNamedData) {
                try {
                    const oldMaps = await fetchLocaleMaps(old);
                    const newMaps = collectCurrentLocaleMaps();
                    const renamed = applyRenameToGameState(buildRenameMap(oldMaps, newMaps));
                    _finishLocaleRecord(current);
                    if (renamed) {
                        console.log(`[languagecontrol] 存档名称已迁移：${old} → ${current}`);
                        return true;
                    }
                } catch (e) {
                    console.error('[languagecontrol] 存档名称迁移失败：', e);
                    return false;
                }
            }
        }
        return _finishLocaleRecord(current);
    }

    /* 记录存档名称所属 locale；返回是否发生了变更 */
    function _finishLocaleRecord(current) {
        if (gameState.settings && gameState.settings.dataLocale !== current) {
            gameState.settings.dataLocale = current;
            if (typeof markDirty === 'function') markDirty();
            return true;
        }
        return false;
    }

    /* 全局数据就绪 promise：main.js 启动前 await 它 */
    window.__dataReadyPromise = (async () => {
        try {
            const initial = resolveInitialDataLocale();
            await loadDataPack(initial);
        } catch (e) {
            console.error('[languagecontrol] 加载数据文件失败：', e);
        }
    })();

    function applyLocaleUI() {
        const nextLocale = resolveCurrentLocaleKey();
        window.currentLocale = nextLocale;
        window.LANG_ACTIVE = getPackByLocale(nextLocale);
        if (document && document.documentElement) {
            document.documentElement.lang = nextLocale === 'en' ? 'en' : 'zh';
        }
        if (typeof applyStaticTextTranslations === 'function') applyStaticTextTranslations();
        if (typeof renderSettings === 'function') renderSettings();
        if (typeof renderGame === 'function') renderGame();
        return nextLocale;
    }

    function setLanguage(target) {
        const normalized = target === 'auto' ? 'auto' : (normalizeLocaleKey(target) || 'auto');
        const previous = (typeof gameState !== 'undefined' && gameState.settings) ? gameState.settings.language : 'auto';

        if (typeof gameState !== 'undefined' && gameState.settings) {
            gameState.settings.language = normalized;
        }

        const nextLocale = resolveCurrentLocaleKey();
        window.currentLocale = nextLocale;
        window.LANG_ACTIVE = getPackByLocale(nextLocale);
        if (document && document.documentElement) {
            document.documentElement.lang = nextLocale === 'en' ? 'en' : 'zh';
        }

        /* 如果数据文件 locale 发生了变化，需要重新加载页面以便加载新的数据 */
        const dataLocaleChanged = (typeof window.currentDataLocale === 'string') && (window.currentDataLocale !== nextLocale);

        if (typeof applyStaticTextTranslations === 'function') applyStaticTextTranslations();
        if (typeof renderSettings === 'function') renderSettings();
        if (typeof renderGame === 'function') renderGame();

        /* 标记 dirty，便于自动存档把新的 language 写回 localStorage */
        if (typeof markDirty === 'function') markDirty();

        if (dataLocaleChanged && previous !== normalized) {
            /* 先把语言偏好写成独立标记（比存档更可靠），再写入存档；然后刷新页面加载新 locale 的数据文件 */
            setStoredLanguagePreference(normalized === 'auto' ? getBrowserLocaleKey() : normalized);
            try {
                if (typeof saveGame === 'function') saveGame(true);
            } catch (e) { /* ignore */ }
            /* 一次性标记：刷新后直接续玩，不再弹起始选择框 */
            try { localStorage.setItem(SKIP_START_SCREEN_KEY, '1'); } catch (e) { /* ignore */ }
            /* 轻量遮罩，刷新后自动续玩（不再回到开始页） */
            try {
                const overlay = document.getElementById('lang-switch-overlay');
                if (overlay) overlay.classList.add('show');
            } catch (e) { /* ignore */ }
            setTimeout(() => {
                try { window.location.reload(); } catch (e) { /* ignore */ }
            }, 220);
        } else {
            /* 数据语言没变（如 zh-CN → zh）：无需刷新，只记偏好 */
            setStoredLanguagePreference(normalized === 'auto' ? getBrowserLocaleKey() : normalized);
        }

        return nextLocale;
    }

    window.languageControl = {
        packs: window.LANG_PACKS,
        normalizeLocaleKey,
        getBrowserLocaleKey,
        getCurrentLocaleKey: resolveCurrentLocaleKey,
        resolveCurrentLocaleKey,
        translate,
        localize: translate,
        setLanguage,
        applyLocaleFromSettings: applyLocaleUI,
        loadDataPack,
        resolveInitialDataLocale,
        syncLanguagePreference,
        setStoredLanguagePreference,
        getStoredLanguagePreference,
        migrateSaveNamesIfNeeded,
        safeToString,
    };

    /* 暴露便捷全局入口（部分旧代码 / 控制台会直接调用 setLanguage） */
    window.setLanguage = setLanguage;

    /* 启动即把偏好同步进 gameState，保证界面语言与数据文件语言一致 */
    syncLanguagePreference();

    window.currentLocale = resolveCurrentLocaleKey();
    window.LANG_ACTIVE = getPackByLocale(window.currentLocale);
    window.t = translate;
    window.localize = translate;
})();
