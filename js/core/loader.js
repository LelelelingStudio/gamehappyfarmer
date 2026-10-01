/* ============================================================
   loader.js  —  资源加载进度（manifest 驱动）
   ------------------------------------------------------------
   加载顺序：html → css → js → langdata → 音频 → 图片 → 其他
   进度权重（总和 100%）：
     html 0.08% · css 0.22% · js 0.72% · langdata 4.42%
     音频 41.92% · 图片 49% · 其他 3.64%
   在进度条上显示当前正在加载什么，全部完成后再显示起始弹窗。
   ============================================================ */

const LOADER_WEIGHTS = {
    html:     0.08,
    css:      0.22,
    js:       0.72,
    langdata: 4.42,
    audio:    41.92,
    images:   49.00,
    other:    3.64,
};

const LOADER_STAGE_LABEL = {
    html:     'loader.stageHtml',
    css:      'loader.stageCss',
    js:       'loader.stageJs',
    langdata: 'loader.stageLangdata',
    audio:    'loader.stageAudio',
    images:   'loader.stageImages',
    other:    'loader.stageOther',
};

const LOADER_IMAGE_CONCURRENCY = 3;     /* 图片并发数：放行后后台慢慢拉，不能抢 BGM 的带宽 */
const LOADER_IMAGE_DELAY_MS = 2500;     /* 放行后再等一会儿才开始拉图片 */
const LOADER_HARD_TIMEOUT_MS = 8000;    /* 兜底：8 秒一定放行（宁可先进游戏，也不能卡在加载页） */
const LOADER_SOFT_TIMEOUT_MS = 3000;    /* 只等必要资源；最多 3 秒就放行，音频/图片后台继续加载 */

/* -------- UI -------- */

function _loaderEls() {
    return {
        screen: document.getElementById('loading-screen'),
        fill: document.getElementById('loading-progress-fill'),
        percent: document.getElementById('loading-percent'),
        status: document.getElementById('loading-status'),
    };
}

function _loaderSetProgress(percent, stageKey) {
    const { fill, percent: pctEl, status } = _loaderEls();
    const value = Math.max(0, Math.min(100, percent));
    if (fill) fill.style.width = value.toFixed(2) + '%';
    if (pctEl) pctEl.textContent = value.toFixed(1) + '%';
    if (status && stageKey) {
        const label = t(LOADER_STAGE_LABEL[stageKey] || 'ui.loadingFarm');
        status.textContent = label || '';
    }
}

/* -------- 小工具 -------- */

function _loaderSleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/* 轮询直到条件成立或超时（用于等待浏览器自己加载 css / js） */
async function _waitFor(check, timeoutMs = 6000, interval = 40) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try { if (check()) return true; } catch (e) { /* ignore */ }
        await _loaderSleep(interval);
    }
    return false;
}

/* 带进度的并发池 */
function _loadPool(items, loader, concurrency, onProgress) {
    return new Promise((resolve) => {
        if (!items || items.length === 0) { onProgress(items ? items.length : 0, 0); resolve(); return; }
        let index = 0;
        let done = 0;
        let active = 0;
        const next = () => {
            if (index >= items.length && active === 0) { resolve(); return; }
            while (active < concurrency && index < items.length) {
                const item = items[index++];
                active++;
                Promise.resolve()
                    .then(() => loader(item))
                    .catch(() => {})
                    .then(() => {
                        active--;
                        done++;
                        onProgress(items.length, done);
                        next();
                    });
            }
        };
        next();
    });
}

function _preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        let settled = false;
        const finish = () => { if (!settled) { settled = true; resolve(); } };
        img.onload = finish;
        img.onerror = finish;
        /* 兜底：单张图最多等 15 秒 */
        setTimeout(finish, 15000);
        img.src = src;
    });
}

function _preloadAudioMeta(src) {
    return new Promise((resolve) => {
        try {
            const el = new Audio();
            let settled = false;
            const finish = () => { if (!settled) { settled = true; el.src = ''; resolve(); } };
            el.preload = 'metadata';
            el.addEventListener('loadedmetadata', finish, { once: true });
            el.addEventListener('error', finish, { once: true });
            setTimeout(finish, 4000);
            el.src = src;
        } catch (e) { resolve(); }
    });
}

function _preloadAudio(src) {
    return new Promise((resolve) => {
        const el = new Audio();
        let settled = false;
        const finish = () => { if (!settled) { settled = true; resolve(); } };
        el.addEventListener('loadeddata', finish, { once: true });
        el.addEventListener('canplaythrough', finish, { once: true });
        el.addEventListener('error', finish, { once: true });
        setTimeout(finish, 20000);
        el.preload = 'auto';
        el.src = src;
        try { el.load(); } catch (e) { finish(); }
    });
}

/* -------- 主流程 -------- */

let _loaderRunning = null;
let _loaderForceFinished = false;
let _loaderSoftDone = false;

/* 放行：通知 main.js 进入起始弹窗（只生效一次） */
function releaseLoader() {
    if (_loaderSoftDone) return;
    _loaderSoftDone = true;
    try {
        window.__loaderReleased = true;
        if (typeof window.__loaderRelease === 'function') window.__loaderRelease();
        else window.__loaderPendingRelease = true;   /* main.js 还没挂钩子，等它挂上再放行 */
    } catch (e) { /* ignore */ }
}

/** 让加载条直接走完（数据加载超时等异常情况下调用） */
function forceFinishLoading() {
    _loaderForceFinished = true;
    _loaderSetProgress(100, 'other');
}

async function runAssetLoading() {
    if (_loaderRunning) return _loaderRunning;

    _loaderRunning = (async () => {
        const manifest = (typeof ASSET_MANIFEST !== 'undefined' && ASSET_MANIFEST) ? ASSET_MANIFEST : null;
        const startedAt = Date.now();
        let progress = 0;

        const add = (weight, ratio, stageKey) => {
            progress += weight * Math.max(0, Math.min(1, ratio));
            _loaderSetProgress(progress, stageKey);
        };
        const completeStage = (stageKey) => {
            /* 补齐该阶段剩余权重（按已完成比例补齐，避免浮点误差） */
            const target = progress + 0;   /* 占位，实际由 add 完成 */
            return target;
        };

        /* --- 1. HTML（当前文档已经解析完成） --- */
        _loaderSetProgress(0, 'html');
        await _loaderSleep(30);
        add(LOADER_WEIGHTS.html, 1, 'html');

        if (!manifest) {
            /* 没有清单（例如被删掉）：直接放行，保证游戏能进 */
            console.warn('[loader] 未找到 assets/manifest.js，跳过资源预加载');
            forceFinishLoading();
            return;
        }

        /* --- 2. CSS --- */
        const cssTotal = (manifest.css || []).length;
        if (cssTotal > 0) {
            await _waitFor(() => document.styleSheets.length >= cssTotal, 6000);
        }
        add(LOADER_WEIGHTS.css, 1, 'css');
        await _loaderSleep(20);

        /* --- 3. JS（等主入口就位） --- */
        await _waitFor(
            () => typeof window.bootstrap === 'function' && !!window.__dataReadyPromise,
            8000
        );
        add(LOADER_WEIGHTS.js, 1, 'js');
        await _loaderSleep(20);

        /* --- 4. langdata（游戏自己的动态加载器；等它就绪） --- */
        if (window.__dataReadyPromise && typeof window.__dataReadyPromise.then === 'function') {
            try {
                await Promise.race([
                    window.__dataReadyPromise,
                    _loaderSleep(30000),
                ]);
            } catch (e) { /* 数据出错也要继续 */ }
        }
        add(LOADER_WEIGHTS.langdata, 1, 'langdata');
        await _loaderSleep(20);

        /* 关键：到这里游戏所需的一切都已就绪，立刻放行进入起始弹窗。
           音频 / 图片继续在后台预加载（进度条会继续走，但不再阻塞玩家）。 */
        releaseLoader();

        /* --- 5. 音频 --- */
        const audioList = manifest.audio || [];
        let audioWeightUsed = 0;
        if (audioList.length > 0) {
            /* 只读取第一首的元数据：整首 mp3 有 6MB，预下载会抢走 BGM 播放所需的带宽，
               导致进入游戏后“听不到声音”。这里不再做整首预加载。 */
            await _preloadAudioMeta(audioList[0]);
            _loaderSetProgress(progress + LOADER_WEIGHTS.audio, 'audio');
            audioWeightUsed = LOADER_WEIGHTS.audio;
        }
        progress += audioWeightUsed;
        _loaderSetProgress(progress, 'audio');
        await _loaderSleep(20);

        /* --- 6. 图片（这里已经在后台，不再阻塞玩家） --- */
        const imageList = manifest.images || [];
        const slowNet = (() => {
            try {
                const c = navigator.connection || {};
                return !!c.saveData || /(^|-)(2g|slow-2g)$/.test(c.effectiveType || '');
            } catch (e) { return false; }
        })();
        if (slowNet) {
            console.warn('[loader] 检测到省流量/慢速网络，跳过图片预加载');
            imageList.length = 0;
        }
        await _loaderSleep(LOADER_IMAGE_DELAY_MS);
        if (imageList.length > 0) {
            await _loadPool(
                imageList,
                (src) => _preloadImage(src),
                LOADER_IMAGE_CONCURRENCY,
                (total, done) => {
                    const ratio = total ? done / total : 1;
                    _loaderSetProgress(progress + LOADER_WEIGHTS.images * ratio, 'images');
                }
            );
            progress += LOADER_WEIGHTS.images;
        } else {
            progress += LOADER_WEIGHTS.images;
        }
        _loaderSetProgress(progress, 'images');

        /* --- 7. 其他（字体/图标/杂项） --- */
        await _waitFor(() => document.readyState === 'complete', 5000);
        add(LOADER_WEIGHTS.other, 1, 'other');

        /* 保证显示 100% */
        _loaderSetProgress(100, 'other');
        console.log(`[loader] 资源加载完成，用时 ${((Date.now() - startedAt) / 1000).toFixed(2)}s`);
    })();

    return _loaderRunning;
}

/* 脚本一执行就把状态写出来（不必等数据文件就绪） */
if (typeof t === 'function') _loaderSetProgress(0, 'html');

/* 软超时：网速很慢时不要让玩家干等太久，先放行进游戏，资源继续在后台加载 */
setTimeout(() => {
    if (_sessionStarted) return;
    if (_loaderSoftDone) return;
    _loaderSetProgress(100, 'other');
    console.warn('[loader] 必要资源等待超过 ' + (LOADER_SOFT_TIMEOUT_MS / 1000) + 's，先放行，其余资源后台加载');
    releaseLoader();
}, LOADER_SOFT_TIMEOUT_MS);

/* 硬超时兜底 */
setTimeout(() => {
    if (_loaderForceFinished) return;
    _loaderForceFinished = true;
    _loaderSetProgress(100, 'other');
    console.warn('[loader] 加载超时，强制放行');
    releaseLoader();
}, LOADER_HARD_TIMEOUT_MS);
