/* ============================================================
   save.js  —  存档系统
   - 自动存档（dirty 标记 + 定时 flush）
   - 导入 / 导出 .lelelefarmer
   - 头像独立存储
   - 关闭标签页警告
   版本：v1.0.2
   ============================================================ */

/* -------- 内部状态 -------- */
let _autoSaveTimer = null;
let _flushTimer = null;
let _beforeUnloadBound = false;
let _saveWarnedThisSession = false;

/* -------- 要保存的字段白名单 -------- */
const SAVE_FIELDS = [
    'gold', 'level', 'exp', 'expToNextLevel', 'day',
    'ownedPlots', 'landPriceIndex',
    'inventory', 'storageCapacity', 'storageUsed', 'seeds',
    'selectedCrop',
    'weather', 'nextWeather', 'season', 'seasonDay',
    'activeEffects', 'mallItems',
    'processingItems', 'completedItems',
    'merchant', 'consignments', 'auction', 'currencyHistory',
    'currencies',
    'unlockedSkins', 'currentSkin',
    'achievements', 'dailyQuests', 'lastQuestResetDay',
    'user', 'stats',
    'eventFrequency', 'lastTheftDay',
    'factoryLevelFilter', 'factorySearchQuery',
    'mallCategoryFilter', 'mallPriceFluctuation',
    'layoutMode', 'settings',
    'guideSeen', 'rulesSeen', 'dynamicGuidesSeen',
    'saveVersion',
];

/* ============================================================
   地块 RLE 序列化
   ============================================================ */

/**
 * 把 gameState.plots 序列化成紧凑数组
 * 按"状态签名"分组，同组的地块 ID 用 RLE 编码
 * @returns {Array} [{ ids: "1-90", data: {...} }, ...]
 */
function serializePlots() {
    const groups = {};
    for (const key of Object.keys(gameState.plots)) {
        const id = Number(key);
        const plot = gameState.plots[key];
        const sig = JSON.stringify(plot);
        if (!groups[sig]) {
            groups[sig] = { ids: [], data: plot };
        }
        groups[sig].ids.push(id);
    }
    return Object.values(groups).map(g => ({
        ids: encodeIdsRLE(g.ids),
        data: g.data,
    }));
}

/**
 * 把紧凑数组还原成 gameState.plots
 * @param {Array} compact
 * @returns {object}
 */
function deserializePlots(compact) {
    const plots = {};
    if (!Array.isArray(compact)) return plots;
    for (const entry of compact) {
        const ids = decodeIdsRLE(entry.ids);
        for (const id of ids) {
            plots[id] = deepClone(entry.data);
        }
    }
    return plots;
}

/* ============================================================
   构建 / 应用存档对象
   ============================================================ */

/**
 * 从 gameState 构建可序列化的存档对象
 */
function _buildSaveData() {
    const data = {};
    for (const f of SAVE_FIELDS) {
        data[f] = gameState[f];
    }
    data.plotsCompact = serializePlots();
    data.savedAt = Date.now();
    return data;
}

/**
 * 把存档对象应用到 gameState
 * @param {object} data
 */
function _applySaveData(data) {
    if (!data || typeof data !== 'object') return;

    for (const f of SAVE_FIELDS) {
        if (data[f] !== undefined) {
            gameState[f] = data[f];
        }
    }

    /* 地块 */
    if (data.plotsCompact) {
        gameState.plots = deserializePlots(data.plotsCompact);
    }

    /* 兼容旧存档：补齐 currencies 字段 */
    if (!gameState.currencies || typeof gameState.currencies !== 'object') {
        gameState.currencies = {
            copperCoin: 0,
            silver:     0,
            goldCoin:   0,
            diamond:    0,
        };
    }

    /* 冷却清零 */
    gameState.nextDayReadyAt = 0;
    gameState.nextDayCooldownSec = 0;

    /* 清理内部标记 */
    gameState._dirty = false;
    gameState._lastSavedAt = data.savedAt || Date.now();
}

/* ============================================================
   存档大小检查
   ============================================================ */

function _getSaveSize(data) {
    try {
        return new Blob([JSON.stringify(data)]).size;
    } catch (e) {
        return 0;
    }
}

async function _checkSaveSize(size) {
    if (size > SAVE_SIZE_MAX) {
        await showAlert(
            t('save.saveLarge'),
            t('save.saveLargeBody', { size: bytesToKB(size) })
        );
        return false;
    }
    if (size > SAVE_SIZE_WARN && !_saveWarnedThisSession) {
        _saveWarnedThisSession = true;
        showAlert(
            t('save.saveBig'),
            t('save.saveBigBody', { size: bytesToKB(size) })
        );
    }
    return true;
}

/* ============================================================
   自动存档
   ============================================================ */

/**
 * 保存到 localStorage
 * @param {boolean} force 是否强制保存（忽略 dirty）
 * @returns {boolean} 是否成功
 */
function saveGame(force = false) {
    if (!force && !gameState._dirty) return false;

    try {
        const data = _buildSaveData();
        const size = _getSaveSize(data);

        /* 尺寸检查（异步，不阻塞保存） */
        if (size > SAVE_SIZE_MAX) {
            _checkSaveSize(size);
            return false;
        }

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        gameState._dirty = false;
        gameState._lastSavedAt = Date.now();

        /* 顺便保存用户信息 */
        _saveUserMeta();

        return true;
    } catch (e) {
        console.error('存档失败', e);
        /* 存储满时的兜底 */
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            showAlert(
                t('save.saveFailed'),
                t('save.saveFailedBody')
            );
        }
        return false;
    }
}

/**
 * 立即保存（如果有 dirty）
 */
function flushSave() {
    if (gameState._dirty) {
        saveGame(true);
    }
}

/**
 * 启动自动存档循环
 */
function startAutoSave() {
    if (_autoSaveTimer) clearInterval(_autoSaveTimer);
    if (_flushTimer) clearInterval(_flushTimer);

    /* 每隔一段时间检查 dirty 并保存 */
    _flushTimer = setInterval(() => {
        if (gameState._dirty) {
            saveGame(false);
        }
    }, SAVE_DEBOUNCE_MS);

    /* 兜底：不管怎样每 30 秒都保存一次 */
    _autoSaveTimer = setInterval(() => {
        saveGame(true);
    }, SAVE_INTERVAL_MS);
}

/**
 * 手动保存（顶栏 💾 按钮）
 */
async function manualSave() {
    const ok = saveGame(true);
    if (ok) {
        await showAlert(t('save.saveSuccess'), t('save.saveSuccessBody'));
    } else {
        await showAlert(t('save.saveWriteFailed'), t('save.saveWriteFailedBody'));
    }
}

/* ============================================================
   读档
   ============================================================ */

/**
 * 从 localStorage 读取存档
 * @returns {boolean} 是否读取到有效存档
 */
function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;

        const data = safeJSONParse(raw, null);
        if (!data) return false;

        /* 版本迁移 */
        const migrated = migrateSave(data);

        _applySaveData(migrated);

        /* 加载头像和用户信息 */
        loadAvatar();
        _loadUserMeta();

        return true;
    } catch (e) {
        console.error('读档失败', e);
        return false;
    }
}

/**
 * 是否存在本地存档
 */
function hasLocalSave() {
    return !!localStorage.getItem(SAVE_KEY);
}

/* ============================================================
   版本迁移
   ============================================================ */

function migrateSave(data) {
    if (!data) return data;

    /* v1.0.1 → v1.0.2：新增 currencies 字段 */
    if (!data.currencies || typeof data.currencies !== 'object') {
        data.currencies = {
            copperCoin: 0,
            silver:     0,
            goldCoin:   0,
            diamond:    0,
        };
    }

    /* 未来在这里按版本号逐步升级 */
    /* 例：
    if (data.saveVersion === '1.0.2') {
        // v1.0.2 → v1.0.3 的字段迁移
        data.someNewField = defaultValue;
        data.saveVersion = '1.0.3';
    }
    */

    return data;
}

/* ============================================================
   重置
   ============================================================ */

async function resetSave(confirmFirst = true) {
    if (confirmFirst) {
        const ok = await showDangerConfirm(
            t('save.resetTitle'),
            t('save.resetBody'),
            t('save.resetConfirm')
        );
        if (!ok) return false;
    }

    try {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(SAVE_AVATAR_KEY);
        localStorage.removeItem(SAVE_META_KEY);
        resetGameState();
        return true;
    } catch (e) {
        console.error('重置失败', e);
        return false;
    }
}

/* ============================================================
   头像 / 用户信息（独立存储）
   ============================================================ */

function saveAvatar(dataUrl) {
    try {
        if (!dataUrl) {
            localStorage.removeItem(SAVE_AVATAR_KEY);
        } else {
            localStorage.setItem(SAVE_AVATAR_KEY, dataUrl);
        }
        return true;
    } catch (e) {
        console.error('保存头像失败', e);
        return false;
    }
}

function loadAvatar() {
    try {
        const dataUrl = localStorage.getItem(SAVE_AVATAR_KEY);
        /* 存档里已经带了头像标记（emoji / 素材库文件名 / 自定义图）时以存档为准，
           只有存档没记录头像时才退回本地 base64 备份（老存档兼容）。 */
        if (dataUrl && !gameState.user.avatar) {
            gameState.user.avatar = dataUrl;
        }
        return dataUrl;
    } catch (e) {
        return null;
    }
}

/**
 * 清空本地缓存存档（存档 / 头像 / 用户信息），保留语言偏好。
 * 用于「开始新游戏」时抹除旧进度。
 */
function clearLocalSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem(SAVE_AVATAR_KEY);
        localStorage.removeItem(SAVE_META_KEY);
        return true;
    } catch (e) {
        console.error('清空本地存档失败', e);
        return false;
    }
}

function _saveUserMeta() {
    try {
        const meta = {
            nickname: gameState.user.nickname,
            userId: gameState.user.userId,
        };
        localStorage.setItem(SAVE_META_KEY, JSON.stringify(meta));
    } catch (e) {
        /* 忽略 */
    }
}

function _loadUserMeta() {
    try {
        const raw = localStorage.getItem(SAVE_META_KEY);
        const meta = safeJSONParse(raw, null);
        if (meta) {
            if (meta.nickname) gameState.user.nickname = meta.nickname;
            if (meta.userId) gameState.user.userId = meta.userId;
        }
    } catch (e) {
        /* 忽略 */
    }
}

/* ============================================================
   导出存档
   ============================================================ */

/**
 * 导出为 .lelelefarmer 文件
 * @param {object} options { includeCover: boolean, fileName: string }
 */
async function exportSave(options = {}) {
    try {
        const data = _buildSaveData();

        /* 构建导出对象 */
        const exportObj = {
            magic: SAVE_FILE_MAGIC,
            version: GAME_VERSION,
            exportedAt: Date.now(),
            meta: {
                nickname: gameState.user.nickname,
                level: gameState.level,
                gameDay: gameState.day,
                gold: gameState.gold,
                coverImage: options.includeCover ? (gameState.user.avatar || null) : null,
                /* 头像短标记（emoji / 素材库文件名），导入时优先使用 */
                avatar: gameState.user.avatar || null,
            },
            state: data,
        };

        /* 转 JSON */
        const jsonStr = JSON.stringify(exportObj, null, 0);

        /* 文件名 */
        const defaultName = t('save.exportFileName', {
            day: gameState.day,
            name: gameState.user.nickname || t('user.nicknameDefault'),
            date: _formatDateForFile(),
        });
        const fileName = options.fileName || defaultName;

        /* 触发下载 */
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + SAVE_FILE_EXT;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return true;
    } catch (e) {
        console.error('导出失败', e);
        await showAlert(t('save.exportFailed'), t('save.exportFailedBody'));
        return false;
    }
}

function _formatDateForFile() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/* ============================================================
   导入存档
   ============================================================ */

/**
 * 从文件导入存档
 * @param {File} file
 * @param {boolean} fromNewGame 是否从"新游戏"入口导入（行为不同）
 */
async function importSave(file, fromNewGame = false) {
    if (!file) return false;

    try {
        /* 读取文件 */
        const text = await file.text();
        const data = safeJSONParse(text, null);

        if (!data) {
            await showAlert(t('save.importFailed'), t('save.importBadJson'));
            return false;
        }

        /* 校验 magic */
        if (data.magic !== SAVE_FILE_MAGIC) {
            await showAlert(t('save.importFailed'), t('save.importBadFile'));
            return false;
        }

        /* 版本检查 */
        if (data.version && data.version > GAME_VERSION) {
            const ok = await showConfirm(
                t('save.versionMismatchTitle'),
                t('save.versionMismatchBody', { version: data.version, gameVersion: GAME_VERSION })
            );
            if (!ok) return false;
        }

        /* 覆盖确认（如果不是从新游戏入口） */
        if (!fromNewGame && hasLocalSave()) {
            const ok = await showDangerConfirm(
                t('save.coverTitle'),
                t('save.coverBody'),
                t('save.coverConfirm')
            );
            if (!ok) return false;
        }

        /* 应用存档 */
        const stateData = data.state;
        if (!stateData) {
            await showAlert(t('save.importFailed'), t('save.missingData'));
            return false;
        }

        const migrated = migrateSave(stateData);
        _applySaveData(migrated);

        /* 头像：优先读短标记，其次兼容老存档的 base64 coverImage */
        const importedAvatar = (data.meta && (data.meta.avatar || data.meta.coverImage)) || null;
        if (importedAvatar) {
            if (typeof setUserAvatar === 'function') setUserAvatar(importedAvatar);
            else { gameState.user.avatar = importedAvatar; saveAvatar(importedAvatar); }
        }

        /* 立即保存到 localStorage */
        saveGame(true);

        await showAlert(t('save.importSuccess'), t('save.importSuccessBody'));
        return true;

    } catch (e) {
        console.error('导入失败', e);
        await showAlert(t('save.importFailed'), t('save.importErrorBody', { message: e.message }));
        return false;
    }
}

/* ============================================================
   关闭标签页警告
   ============================================================ */

function attachBeforeUnload() {
    if (_beforeUnloadBound) return;
    _beforeUnloadBound = true;

    window.addEventListener('beforeunload', (e) => {
        /* 先尝试同步保存 */
        if (gameState._dirty) {
            saveGame(true);
        }

        /* 如果还有未保存的改动，警告 */
        if (SAVE_WARN_BEFORE_LEAVE && gameState._dirty) {
            e.preventDefault();
            e.returnValue = t('save.leaveWarning');
            return e.returnValue;
        }
    });
}

/* ============================================================
   导出 / 导入 UI 辅助（供 settingsUI.js 使用）
   ============================================================ */

/**
 * 显示导出对话框（勾选是否包含头像做封面）
 */
async function showExportDialog() {
    const result = await showModal(
        t('save.exportDialogTitle'),
        t('save.exportDialogBody'),
        [
            { text: t('common.cancel'), value: null },
            { text: t('save.exportNoCover'), value: 'no-cover' },
            { text: t('save.exportWithCover'), value: 'with-cover', primary: true },
        ]
    );

    if (!result) return;

    const includeCover = result === 'with-cover';
    const ok = await exportSave({ includeCover });
    if (ok) {
        showAlert(t('save.exportSuccess'), t('save.exportSuccessBody'));
    }
}

/**
 * 显示导入对话框（打开文件选择器）
 * @param {boolean} fromNewGame
 */
function showImportDialog(fromNewGame = false, onComplete = null) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = SAVE_FILE_EXT + ',application/json';
    input.style.display = 'none';

    input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const imported = await importSave(file, fromNewGame);
        if (typeof renderGame === 'function' && imported) renderGame();
        if (imported && typeof onComplete === 'function') onComplete();
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
        if (input.parentNode) input.parentNode.removeChild(input);
    }, 1000);
}