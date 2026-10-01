/* ============================================================
   main.js  —  入口
   版本：v1.0.2
   ============================================================ */

/* ============================================================
   新游戏初始化
   ============================================================ */
function initGame() {
    resetGameState();

    /* 新游戏不应把玩家选好的语言重置成 auto（否则开新档会突然变成浏览器语言） */
    if (window.languageControl && typeof window.languageControl.getStoredLanguagePreference === 'function') {
        const pref = window.languageControl.getStoredLanguagePreference();
        if (pref && gameState.settings) gameState.settings.language = pref;
    }

    /* 默认昵称跟随当前语言（玩家改过就不会被覆盖） */
    if (typeof t === 'function' && gameState.user) {
        const defaults = ['农场主', 'Farmer', ''];
        if (defaults.includes(gameState.user.nickname)) {
            gameState.user.nickname = t('user.nicknameDefault') || gameState.user.nickname;
        }
    }

    /* 各子系统初始化 */
    if (typeof initWeather     === 'function') initWeather();
    if (typeof initCurrencies  === 'function') initCurrencies();
    if (typeof initAchievements === 'function') initAchievements();
    if (typeof initSkin        === 'function') initSkin();
    if (typeof initQuests      === 'function') initQuests();

    // Initialize factory products after data is loaded
    if (typeof initializeFactoryProducts === 'function') initializeFactoryProducts();

    addLog(t('game.welcome'), 'success');
}

/* ============================================================
   下一天（核心流程）
   ============================================================ */
function nextDay() {
    /* 冷却检查 */
    if (gameState.nextDayReadyAt && Date.now() < gameState.nextDayReadyAt) {
        const left = Math.ceil((gameState.nextDayReadyAt - Date.now()) / 1000);
        showNotification(t('game.cooldown'), t('game.wait', { seconds: left }), 'warning');
        return;
    }

    /* 1. 天气 / 季节 */
    if (typeof advanceWeather === 'function') advanceWeather();

    /* 2. 作物生长 */
    if (typeof growCrops === 'function') growCrops(1);

    /* 3. 加工厂完成检查 */
    if (typeof checkProcessingProgress === 'function') checkProcessingProgress();

    /* 4. 商人 */
    if (typeof checkMerchant === 'function') checkMerchant();

    /* 5. 寄卖 */
    if (typeof checkConsignments === 'function') checkConsignments();

    /* 6. 拍卖 */
    if (typeof advanceAuction === 'function') advanceAuction();

    /* 7. 时间道具倒计时 */
    if (typeof checkTimedEffects === 'function') checkTimedEffects();

    /* 8. 随机事件 */
    if (typeof rollRandomEvent === 'function') rollRandomEvent();

    /* 9. 天数 +1 */
    gameState.day++;
    gameState.stats.dayReached = gameState.day;

    /* 10. 记录天气 / 季节 */
    if (!gameState.stats.weatherSeen) gameState.stats.weatherSeen = {};
    gameState.stats.weatherSeen[gameState.weather] = true;
    if (!gameState.stats.seasonSeen) gameState.stats.seasonSeen = {};
    gameState.stats.seasonSeen[gameState.season] = true;

    /* 11. 每日重置 */
    if (typeof resetDailyFlags === 'function') resetDailyFlags();
    if (typeof checkQuestReset === 'function') checkQuestReset();

    /* 12. 每日自动化（自动浇水 / 收获 / 种植，由商城道具解锁） */
    if (typeof runFarmAutomation === 'function') runFarmAutomation();

    /* 13. 商城价格波动 */
    if (typeof gameState.mallPriceFluctuation === 'object') {
        if (gameState.mallPriceFluctuation.daysLeft > 0) {
            gameState.mallPriceFluctuation.daysLeft--;
            if (gameState.mallPriceFluctuation.daysLeft <= 0) {
                gameState.mallPriceFluctuation = {};
            }
        }
    }

    /* 14. 启动冷却 */
    gameState.nextDayReadyAt = Date.now() + NEXT_DAY_COOLDOWN_SEC * 1000;
    gameState._nextDayReadyNotified = false;

    /* 15. 成就检查 */
    if (typeof checkAchievements === 'function') checkAchievements();

    markDirty();
    renderGame();

    addLog(t('game.dayLog', {
        day: gameState.day,
        weather: gameState.weather,
        season: gameState.season,
    }), 'event');
}

/* ============================================================
   事件绑定
   ============================================================ */
function bindAllEvents() {
    /* --- 顶栏 --- */
    const logBtn = document.getElementById('log-btn');
    if (logBtn) logBtn.onclick = () => {
        const sec = document.getElementById('log-section');
        if (!sec) return;
        sec.classList.add('open');
        /* 平滑滚动，让日志区出现在视口上方 */
        try {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            window.scrollTo({ top: sec.offsetTop, behavior: 'smooth' });
        }
        /* 闪一下让玩家注意到 */
        sec.classList.add('flash');
        setTimeout(() => sec.classList.remove('flash'), 1400);
    };

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.onclick = () => manualSave();

    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.onclick = () => {
        if (typeof openSettings === 'function') openSettings();
        else showAlert(t('ui.settings'), t('ui.settingsIncomplete'));
    };

    const userBtn = document.getElementById('user-btn');
    if (userBtn) userBtn.onclick = () => {
        if (typeof openUserDialog === 'function') openUserDialog();
        else showAlert(t('ui.userCenter'), t('ui.userCenterIncomplete'));
    };

    /* --- 农田操作 --- */
    const buyLandBtn = document.getElementById('buy-land-btn');
    if (buyLandBtn) buyLandBtn.onclick = () => {
        const r = buyLand();
        if (!r.ok) { showAlert(t('ui.buyLandFailed'), r.reason); return; }
        showNotification(t('ui.buyLandSuccess'), t('ui.buyLandCost', { price: r.price }), 'success');
        addLog(t('ui.buyLandLog', { price: r.price }), 'success');
        renderGame();
    };

    const waterAllBtn = document.getElementById('water-all-btn');
    if (waterAllBtn) waterAllBtn.onclick = () => {
        const r = waterAllCrops();
        if (!r.ok) { showAlert(t('ui.waterAll'), r.reason); return; }
        showNotification(t('ui.waterAll'), t('ui.waterAllCount', { count: r.count }), 'success');
        renderGame();
    };

    const harvestAllBtn = document.getElementById('harvest-all-btn');
    if (harvestAllBtn) harvestAllBtn.onclick = () => {
        const r = harvestAllCrops();
        if (!r.ok) { showAlert(t('ui.harvestAll'), r.reason); return; }
        showNotification(t('ui.harvestAll'), t('ui.harvestAllSummary', { count: r.count, totalValue: r.totalValue }), 'success');
        renderGame();
    };

    const tillAllBtn = document.getElementById('till-all-btn');
    if (tillAllBtn) tillAllBtn.onclick = () => {
        if (typeof startTillAll === 'function') startTillAll();
    };

    const upgradeStorageBtn = document.getElementById('upgrade-storage-btn');
    if (upgradeStorageBtn) upgradeStorageBtn.onclick = () => {
        if (upgradeStorage()) renderGame();
    };

    /* --- 弹窗入口 --- */
    const mallBtn = document.getElementById('mall-btn');
    if (mallBtn) mallBtn.onclick = () => {
        if (typeof openMall === 'function') openMall();
        else showAlert(t('ui.mall'), t('ui.mallIncomplete'));
    };

    const factoryBtn = document.getElementById('factory-btn');
    if (factoryBtn) factoryBtn.onclick = () => {
        if (typeof openFactory === 'function') openFactory();
        else showAlert(t('ui.factory'), t('ui.factoryIncomplete'));
    };

    const consignBtn = document.getElementById('consign-btn');
    if (consignBtn) consignBtn.onclick = () => {
        if (typeof openConsignment === 'function') openConsignment();
        else showAlert(t('ui.consign'), t('ui.consignIncomplete'));
    };

    const auctionBtn = document.getElementById('auction-btn');
    if (auctionBtn) auctionBtn.onclick = () => {
        if (typeof openAuction === 'function') openAuction();
        else showAlert(t('ui.auction'), t('ui.auctionIncomplete'));
    };

    const skinBtn = document.getElementById('skin-btn');
    if (skinBtn) skinBtn.onclick = () => {
        if (typeof openSkinSelector === 'function') openSkinSelector();
        else showAlert(t('ui.skin'), t('ui.skinIncomplete'));
    };

    /* --- 右侧 --- */
    const nextDayBtn = document.getElementById('next-day-btn');
    if (nextDayBtn) nextDayBtn.onclick = nextDay;

    /* 原「全部出售」按钮 → 现在是「商人板块」入口（见 initMerchantUI） */
    const sellAllBtn = document.getElementById('sell-all-btn');
    if (sellAllBtn) sellAllBtn.onclick = () => {
        if (typeof openMerchantHub === 'function') openMerchantHub();
    };

    /* --- 移动端工具栏 --- */
    document.querySelectorAll('.mobile-tool-btn').forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll('.mobile-tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sidePanel = document.getElementById('side-panel');
            const overlay = document.getElementById('drawer-overlay');
            if (!sidePanel) return;
            if (target === 'farm') {
                sidePanel.classList.remove('open');
                if (overlay) overlay.classList.remove('open');
            } else if (target === 'shop' || target === 'inventory') {
                sidePanel.classList.add('open');
                if (overlay) overlay.classList.add('open');
            } else if (target === 'factory') {
                if (typeof openFactory === 'function') openFactory();
            } else if (target === 'settings') {
                if (typeof openSettings === 'function') openSettings();
            }
        };
    });

    /* --- 遮罩关闭抽屉 --- */
    const overlay = document.getElementById('drawer-overlay');
    if (overlay) overlay.onclick = () => {
        const sidePanel = document.getElementById('side-panel');
        if (sidePanel) sidePanel.classList.remove('open');
        overlay.classList.remove('open');
    };

    /* --- 通用关闭按钮（起始屏阶段也要先绑一次，否则起始弹窗里的文档关不掉） --- */
    bindDialogCloseButtons();

    /* --- 日志区在移动端点击隐藏 --- */
    const logSection = document.getElementById('log-section');
    if (logSection && window.innerWidth < 600) {
        const logHeader = logSection.querySelector('h3');
        if (logHeader) logHeader.onclick = () => logSection.classList.remove('open');
    }
}

/* ============================================================
   会话启动
   ============================================================ */

/* 会话是否已启动（防止重复 bootstrap 造成状态互相覆盖） */
let _sessionStarted = false;

/* 按名字调用全局函数（模块函数都声明在全局作用域，落在 window 上） */
function callGlobal(name, ...args) {
    const fn = window[name];
    if (typeof fn === 'function') {
        fn(...args);
        return true;
    }
    return false;
}

/* 单步初始化失败不应该拖垮整局游戏：包一层 try/catch 并记录 */
function runInitStep(label, fn) {
    try {
        if (typeof fn === 'function') fn();
    } catch (e) {
        console.error(`[bootstrap] 「${label}」初始化失败：`, e);
        (window.__initErrors = window.__initErrors || []).push({
            step: label,
            message: (e && e.message) ? e.message : String(e),
        });
    }
}

function startGameSession() {
    if (_sessionStarted) return;
    _sessionStarted = true;

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');
    document.body.classList.add('game-started');

    runInitStep('音频初始化', () => {
        if (typeof audio === 'undefined' || !audio) return;
        if (typeof audio.init === 'function') audio.init();
        /* 关键：这次点击就是有效的用户手势，必须同步 unlock，
           否则线上（新域名没有媒体互动记录）BGM 与音效会被自动播放策略挡住 */
        if (typeof audio.unlock === 'function') audio.unlock();
    });
    runInitStep('通知系统', () => callGlobal('initNotificationSystem'));
    runInitStep('系统通知', () => {
        if (typeof notify !== 'undefined' && notify && typeof notify.init === 'function') notify.init();
    });

    bootstrap();
}

/* ============================================================
   发布者信息 / 静态文案
   ============================================================ */

function getPublisherParams() {
    const localeKey = (window.languageControl && typeof window.languageControl.getCurrentLocaleKey === 'function')
        ? window.languageControl.getCurrentLocaleKey()
        : (gameState && gameState.settings && gameState.settings.language === 'auto' ? 'zh' : (gameState && gameState.settings && gameState.settings.language));
    const isChinese = String(localeKey || '').startsWith('zh');
    return isChinese ? { studio: '了了了岭工作室', brand: '了了了游' } : { studio: 'LelelelingStudio', brand: 'Lelelegame' };
}

function applyStaticTextTranslations() {
    const localeKey = (window.currentLocale || window.languageControl?.getCurrentLocaleKey?.() || 'zh');
    if (document && document.documentElement) {
        document.documentElement.lang = localeKey.startsWith('en') ? 'en' : 'zh';
    }
    /* 浏览器标签页标题也跟着语言走 */
    try {
        const appTitle = t('app.title');
        if (appTitle) document.title = appTitle;
    } catch (e) { /* ignore */ }

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (!key) return;
        const params = key === 'app.publisher' ? getPublisherParams() : (el.dataset.params ? JSON.parse(el.dataset.params) : {});
        const value = t(key, params);
        if (value && value !== key) {
            el.textContent = value;
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.dataset.i18nTitle;
        if (!key) return;
        const value = t(key);
        if (value && value !== key) {
            el.title = value;
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.dataset.i18nPlaceholder;
        if (!key) return;
        const value = t(key);
        if (value && value !== key) {
            el.placeholder = value;
        }
    });
}

/* ============================================================
   起始选择弹窗
   ============================================================ */

function getStartDialog() {
    return document.getElementById('start-screen');
}

/* 显示起始弹窗（有缓存时露出「继续上次的缓存游玩」） */
function showStartScreen() {
    const el = getStartDialog();
    if (!el) return;
    document.body.classList.remove('game-started');
    el.classList.add('show');
    refreshStartScreenState();
    hideLoadingScreen();
}

function hideStartScreen() {
    const el = getStartDialog();
    if (el) el.classList.remove('show');
    document.body.classList.add('game-started');
}

/* 根据是否存在缓存，更新按钮与提示 */
function refreshStartScreenState() {
    const hasSave = (typeof hasLocalSave === 'function') && hasLocalSave();
    const continueBtn = document.getElementById('start-continue-btn');
    const hint = document.getElementById('start-cache-hint');
    const newBtn = document.getElementById('start-new-game-btn');

    if (continueBtn) continueBtn.hidden = !hasSave;
    if (newBtn) {
        newBtn.dataset.i18n = hasSave ? 'ui.startNewGameHasCache' : 'ui.startNewGame';
        newBtn.className = hasSave ? 'btn btn-large' : 'btn btn-primary btn-large';
        newBtn.textContent = t(newBtn.dataset.i18n);
    }

    if (hint) {
        hint.hidden = !hasSave;
        if (hasSave) {
            const info = (typeof getCachedSaveSummary === 'function') ? getCachedSaveSummary() : null;
            hint.textContent = info
                ? t('ui.startCacheHint', {
                    day: info.day,
                    level: info.level,
                    gold: typeof formatNumber === 'function' ? formatNumber(info.gold) : info.gold,
                })
                : t('ui.startCacheHintPlain');
        }
    }

    /* 起始屏上的静态文案也要跟着语言走 */
    applyI18n(document.getElementById('start-screen') || document);
}

/* 所有弹窗右上角 × 的关闭逻辑（幂等，可重复调用） */
function bindDialogCloseButtons(root) {
    (root || document).querySelectorAll('.close-btn[data-close]').forEach((btn) => {
        btn.onclick = () => {
            const id = btn.dataset.close;
            const dialog = document.getElementById(id);
            if (dialog) dialog.classList.remove('show');
        };
    });
}

function bindStartScreen() {
    window.__startBound = true;

    /* 继续缓存存档 */
    const continueBtn = document.getElementById('start-continue-btn');
    if (continueBtn) {
        continueBtn.onclick = () => {
            hideStartScreen();
            startGameSession();
        };
    }

    /* 开始新游戏（有缓存会先询问是否导出备份） */
    const newBtn = document.getElementById('start-new-game-btn');
    if (newBtn) {
        newBtn.onclick = () => { requestNewGame(); };
    }

    /* 导入存档：成功后立刻关闭弹窗并进入游戏 */
    const importBtn = document.getElementById('import-save-btn');
    if (importBtn) {
        importBtn.onclick = () => {
            if (typeof showImportDialog !== 'function') return;
            showImportDialog(true, () => {
                hideStartScreen();
                startGameSession();
            });
        };
    }

    /* 规则 / 隐私政策 / 服务条款（文档弹窗的 × 必须现在就绑好） */
    if (typeof initLegalDialog === 'function') initLegalDialog();
    bindDialogCloseButtons();
}

/**
 * 开始新游戏。
 * 如果浏览器里已有存档：提示旧存档会消失，并给出「先导出备份」的选择。
 */
async function requestNewGame() {
    const hasSave = (typeof hasLocalSave === 'function') && hasLocalSave();
    if (!hasSave) {
        startFreshGame();
        return;
    }

    const choice = await showModal(
        t('ui.newGameTitle'),
        t('ui.newGameCacheBody'),
        [
            { text: t('common.cancel'), value: null },
            { text: t('ui.newGameExportFirst'), value: 'export', primary: true },
            { text: t('ui.newGameWipe'), value: 'wipe', danger: true },
        ]
    );

    if (choice === 'export') {
        /* 先把旧存档保存到本地文件，再开始新游戏并清空缓存 */
        if (typeof showExportDialog === 'function') {
            try { await showExportDialog(); } catch (e) { /* 导出失败也允许继续 */ }
        }
        startFreshGame();
    } else if (choice === 'wipe') {
        startFreshGame();
    }
    /* choice === null → 玩家取消，什么都不做 */
}

/* 清掉本地缓存存档并开始全新一局（语言偏好保留） */
function startFreshGame() {
    if (typeof clearLocalSave === 'function') clearLocalSave();
    hideStartScreen();
    startGameSession();
}

/* ============================================================
   启动主流程
   ============================================================ */

function bootstrap() {
    /* 1. 加载存档 or 新游戏 */
    let loaded = false;
    runInitStep('读取存档', () => { loaded = loadGame(); });

    if (!loaded) {
        runInitStep('初始化新游戏', () => initGame());
        /* 立刻落盘一次：这样刚开的新档刷新后也能用「继续缓存游玩」找回 */
        runInitStep('首次存档', () => { if (typeof saveGame === 'function') saveGame(true); });
    } else {
        runInitStep('子系统初始化', () => {
            ['initWeather', 'initCurrencies', 'initAchievements', 'initSkin', 'initQuests']
                .forEach((name) => callGlobal(name));
            addLog(t('game.loaded'), 'success');
        });
    }

    /* 1.2 语言偏好同步（切语言刷新后，即使存档写入失败也保持语言一致） */
    runInitStep('同步语言偏好', () => {
        if (window.languageControl && typeof window.languageControl.syncLanguagePreference === 'function') {
            window.languageControl.syncLanguagePreference();
        }
    });

    /* 1.5 加工品数据聚合：新游戏和读档都必须执行（否则读档后加工厂为空） */
    runInitStep('聚合加工品数据', () => callGlobal('initializeFactoryProducts'));

    /* 1.4 套用语言设置：刷新 window.currentLocale / <html lang> / 界面文案，
       否则切语言刷新后数据是英文、界面缓存却仍是旧语言 */
    runInitStep('套用语言设置', () => {
        if (window.languageControl && typeof window.languageControl.applyLocaleFromSettings === 'function') {
            window.languageControl.applyLocaleFromSettings();
        }
    });

    /* 1.6 跨语言存档迁移：把旧语言的物品名改成当前语言 */
    if (window.languageControl && typeof window.languageControl.migrateSaveNamesIfNeeded === 'function') {
        try {
            window.languageControl.migrateSaveNamesIfNeeded().then((migrated) => {
                if (migrated && typeof renderGame === 'function') renderGame();
            }).catch((e) => console.warn('[bootstrap] 跨语言存档迁移跳过：', e && e.message));
        } catch (e) {
            console.warn('[bootstrap] 跨语言存档迁移跳过：', e && e.message);
        }
    }

    /* 2. 静态文案 */
    runInitStep('刷新静态文案', () => applyStaticTextTranslations());

    /* 3. 布局 */
    runInitStep('布局', () => { if (typeof layout !== 'undefined' && layout && layout.init) layout.init(); });

    /* 4. 基础 UI */
    runInitStep('日志 UI', () => callGlobal('initLogUI'));
    runInitStep('通知系统', () => callGlobal('initNotificationSystem'));

    /* 5. 附加 UI：逐个隔离，任何一个出问题都不影响其它功能 */
    [
        'initTicker', 'initEffects', 'initShopFilter', 'initFactoryUI', 'initMerchantUI',
        'initMallUI', 'initSkinUI', 'initAchievementUI', 'initConsignmentUI',
        'initAuctionUI', 'initSettingsUI', 'initCurrencyDialogUI', 'initLegalDialog', 'initTradeUI', 'initSoundToggle',
    ].forEach((name) => runInitStep(name, () => callGlobal(name)));

    /* 6. 事件绑定 */
    runInitStep('事件绑定', () => bindAllEvents());

    /* 7. 自动存档 */
    runInitStep('自动存档', () => callGlobal('startAutoSave'));
    runInitStep('离开前保存', () => callGlobal('attachBeforeUnload'));

    /* 8. 计时器 */
    runInitStep('HUD 计时器', () => callGlobal('startHudTimer'));

    /* 9. 首次渲染 */
    runInitStep('首次渲染', () => renderGame());
    runInitStep('声音开关', () => callGlobal('initSoundToggle'));
    /* 启动后 1.5 秒检查一次：开关开着却没响，就试着补播 */
    runInitStep('声音自愈', () => {
        setTimeout(() => {
            if (typeof audio !== 'undefined' && audio.armSelfHeal) audio.armSelfHeal();
            if (typeof audio !== 'undefined' && audio._bgmWantPlay && gameState.settings.bgmEnabled) {
                if (typeof audio.playBgm === 'function') audio.playBgm();
            }
        }, 1500);
    });

    /* 10. 隐藏加载动画（无论前面哪一步失败都必须执行，否则一直停在绿色加载页） */
    runInitStep('隐藏加载动画', () => hideLoadingScreen());

    /* 11. 欢迎语 */
    runInitStep('欢迎语', () => {
        setTimeout(() => {
            if (loaded) {
                showNotification(t('ui.welcomeBack'), `${gameState.user.nickname} · ${t('common.days', { days: gameState.day })}`, 'success');
            } else {
                showNotification(t('ui.welcomeFarm'), `${t('app.title')} · v${GAME_VERSION}`, 'success');
            }
        }, 400);
    });

    /* 12. 全局错误捕获（开发期友好；只绑定一次） */
    if (!window.__globalErrorBound) {
        window.__globalErrorBound = true;
        window.addEventListener('error', (e) => {
            console.error('[全局错误]', e.message, e.filename, e.lineno);
        });
    }

    /* 13. 初始化异常自检提示（只在真出错时出现） */
    if (window.__initErrors && window.__initErrors.length && typeof showNotification === 'function') {
        console.error('[bootstrap] 本次启动存在初始化异常：', window.__initErrors);
    }
}

/* ============================================================
   启动（兼容所有加载时机 + 防重复调用 + 等待数据文件就绪）
   ============================================================ */

function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.dataset.i18n;
        if (!key) return;
        const params = key === 'app.publisher' ? getPublisherParams() : (el.dataset.params ? JSON.parse(el.dataset.params) : {});
        const value = t(key, params);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = value;
        } else {
            el.textContent = value;
        }
    });

    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
        const key = el.dataset.i18nTitle;
        if (!key) return;
        el.title = t(key);
    });
}

/* 一次性标记的读写（切语言刷新、返回标题界面都用它） */
function _consumeOneShotFlag(key) {
    try {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            return true;
        }
    } catch (e) { /* ignore */ }
    return false;
}

/**
 * 起始屏初始化：
 *  - 套用当前语言文案
 *  - 设置里切换语言导致的重载 → 直接续玩，不再弹起始选择框
 *  - 其它情况（首次打开 / 普通刷新 / 主动返回标题）→ 显示起始选择弹窗
 */
function _initStartScreen() {
    runInitStep('音频初始化', () => {
        if (typeof audio !== 'undefined' && audio && typeof audio.init === 'function') audio.init();
    });
    bindStartScreen();
    applyI18n(document);
    if (typeof applyStaticTextTranslations === 'function') applyStaticTextTranslations();

    _consumeOneShotFlag(FORCE_START_SCREEN_KEY);          /* 返回标题：本来就该显示 */
    const skipStart = _consumeOneShotFlag(SKIP_START_SCREEN_KEY);
    const hasSave = (typeof hasLocalSave === 'function') && hasLocalSave();

    if (skipStart && hasSave) {
        /* 切语言后的自动续玩：不打扰玩家 */
        hideStartScreen();
        startGameSession();
        return;
    }

    showStartScreen();
}

/* bootstrap 必须等数据文件加载完才能跑（作物/加工品/皮肤/常量 等都是 const，引用之前必须就绪） */
const _dataReady = (window.__dataReadyPromise && typeof window.__dataReadyPromise.then === 'function')
    ? window.__dataReadyPromise
    : Promise.resolve();

let _dataReadyDone = false;

function _bootstrapAfterDataReady() {
    _dataReady.then(() => {
        _dataReadyDone = true;
        /* 数据就绪后，先把 manifest 里的音频 / 图片全部预加载完（进度条），再进入起始选择弹窗 */
        const afterAssets = () => {
            try {
                _initStartScreen();
            } catch (e) {
                console.error('[main] 起始屏初始化失败：', e);
                hideLoadingScreen();
            }
        };
        /* 软超时放行：loader 到时间后会调用它，避免慢网速下玩家一直等 */
        let released = false;
        const releaseOnce = () => {
            if (released) return;
            released = true;
            /* 先把加载页收掉，再进起始弹窗：任何情况下都不留绿屏 */
            try { hideLoadingScreen(); } catch (e) { /* ignore */ }
            afterAssets();
        };
        window.__loaderRelease = releaseOnce;
        /* 加载器可能更早就已经放行了（超时兜底），补一次 */
        if (window.__loaderPendingRelease) releaseOnce();
        if (typeof runAssetLoading === 'function') {
            runAssetLoading().then(() => releaseOnce()).catch((e) => {
                console.warn('[main] 资源预加载失败，仍然继续：', e && e.message);
                releaseOnce();
            });
        } else {
            afterAssets();
        }
    }).catch((e) => {
        console.error('[main] 数据加载失败，仍尝试启动：', e);
        _dataReadyDone = true;
        try {
            _initStartScreen();
        } catch (e2) {
            console.error('[main] 起始屏初始化再次失败：', e2);
        }
        hideLoadingScreen();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(_bootstrapAfterDataReady, 0);
    });
} else {
    setTimeout(_bootstrapAfterDataReady, 0);
}

/* 兜底：数据加载卡住时也不能永远停在加载页 */
setTimeout(() => {
    if (_sessionStarted) return;
    if (_dataReadyDone) return;   /* 正常路径已经在处理了 */
    console.warn('[main] 数据加载超时，让加载条直接走完');
    if (typeof forceFinishLoading === 'function') forceFinishLoading();
    setTimeout(() => hideLoadingScreen(), 400);
}, 20000);
