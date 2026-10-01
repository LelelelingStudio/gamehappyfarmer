/* ============================================================
   avatarSystem.js  —  头像（素材库 / emoji / 自定义上传）
   ------------------------------------------------------------
   存档里只保存「短标记」，不保存 base64：
     '12.png'            → assets/images/avatars/12.png（素材库）
     '🐱'                → emoji 头像
     'data:image/...'    → 玩家自己上传的图片（唯一需要 base64 的情况）
   素材库图片由玩家放进 assets/images/avatars/1.png ~ 30.png，
   代码不需要任何修改；文件缺失时会显示占位编号，不会出现裂图。
   ============================================================ */

/* -------- 判定 -------- */

function isAvatarLibraryToken(avatar) {
    return /^\d+\.png$/i.test(String(avatar || ''));
}

function isAvatarDataUrl(avatar) {
    return /^data:image\//i.test(String(avatar || ''));
}

function isAvatarEmoji(avatar) {
    const v = String(avatar || '');
    return !!v && !isAvatarLibraryToken(v) && !isAvatarDataUrl(v);
}

/* -------- 展示 -------- */

/** 需要 <img> 时返回图片地址，emoji 头像返回空串 */
function getAvatarImageSrc(avatar) {
    if (isAvatarLibraryToken(avatar)) return AVATAR_LIBRARY_DIR + avatar;
    if (isAvatarDataUrl(avatar)) return avatar;
    return '';
}

/** 头像的统一 HTML（img 或 emoji 文本） */
function getUserAvatarHtml(avatar, fallback = '👤', className = 'avatar-img') {
    const src = getAvatarImageSrc(avatar);
    if (src) {
        const token = isAvatarLibraryToken(avatar) ? avatar : '';
        return `<img class="${className}" src="${src}" alt="avatar"${token ? ` data-avatar-token="${token}"` : ''}
                    onerror="this.style.display='none';if(this.parentNode){this.parentNode.classList.add('avatar-broken');}">`;
    }
    if (isAvatarEmoji(avatar)) return `<span class="avatar-emoji">${avatar}</span>`;
    return `<span class="avatar-emoji">${fallback}</span>`;
}

/* -------- 设置 -------- */

/**
 * 设置当前头像。
 * @param {string} token '' | 'n.png' | emoji | dataURL
 */
function setUserAvatar(token) {
    const value = token || '';
    gameState.user.avatar = value;

    /* 只有自定义上传（dataURL）才写 localStorage 的 base64 备份；
       素材库 / emoji 只是短标记，跟着主存档走即可。 */
    if (isAvatarDataUrl(value)) {
        if (typeof saveAvatar === 'function') saveAvatar(value);
    } else if (typeof saveAvatar === 'function') {
        saveAvatar(null);
    }

    if (typeof markDirty === 'function') markDirty();
    if (typeof _saveUserMeta === 'function') _saveUserMeta();
    if (typeof renderUserAvatar === 'function') renderUserAvatar();
}

/* -------- 选择器 HTML -------- */

/* -------- 缺失图片记忆（避免每次打开都请求 30 个不存在的文件） -------- */

const AVATAR_MISSING_KEY = 'farm_avatar_missing';

function getMissingAvatarTokens() {
    try {
        /* 用 sessionStorage：本次会话内不重复请求 404，刷新后会重新检测，
           这样玩家把 1.png~30.png 放进来刷新一下就能看到。 */
        const raw = sessionStorage.getItem(AVATAR_MISSING_KEY);
        const list = safeJSONParse(raw, []);
        return new Set(Array.isArray(list) ? list : []);
    } catch (e) {
        return new Set();
    }
}

function markAvatarMissing(token) {
    if (!isAvatarLibraryToken(token)) return;
    try {
        const set = getMissingAvatarTokens();
        if (!set.has(token)) {
            set.add(token);
            sessionStorage.setItem(AVATAR_MISSING_KEY, JSON.stringify([...set]));
        }
    } catch (e) { /* ignore */ }
}

function clearAvatarMissingCache() {
    try { sessionStorage.removeItem(AVATAR_MISSING_KEY); } catch (e) { /* ignore */ }
}

function renderAvatarPickerHtml() {
    const current = gameState.user.avatar || '';
    const preview = getAvatarImageSrc(current)
        ? `<img class="avatar-current-img" src="${getAvatarImageSrc(current)}" alt="avatar">`
        : `<span class="avatar-current-emoji">${isAvatarEmoji(current) ? current : '👤'}</span>`;

    return `
        <div class="avatar-picker">
            <div class="avatar-picker-head">
                <div class="settings-section-title">${t('user.avatarLibrary')}</div>
                <button type="button" class="btn btn-small btn-primary" id="avatar-open-btn">${t('user.avatarChoose')}</button>
            </div>
            <div class="avatar-picker-current">
                <span class="avatar-current-preview">${preview}</span>
                <span class="avatar-picker-hint">${t('user.avatarLibraryHint', { dir: AVATAR_LIBRARY_DIR, count: AVATAR_LIBRARY_COUNT })}</span>
            </div>
        </div>
    `;
}

/* -------- 头像选择弹窗 -------- */

function openAvatarDialog() {
    const dlg = document.getElementById('avatar-dialog');
    if (dlg) dlg.classList.add('show');
    renderAvatarDialogBody();
}

function closeAvatarDialog() {
    const dlg = document.getElementById('avatar-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderAvatarDialogBody() {
    const box = document.getElementById('avatar-body');
    if (!box) return;

    const current = gameState.user.avatar || '';
    const missing = getMissingAvatarTokens();

    const emojiButtons = AVATAR_EMOJIS.map((e) => `
        <button type="button" class="avatar-choice avatar-emoji-choice ${current === e ? 'active' : ''}" data-avatar="${e}">${e}</button>
    `).join('');

    let libraryTiles = '';
    for (let i = 1; i <= AVATAR_LIBRARY_COUNT; i++) {
        const token = i + AVATAR_LIBRARY_EXT;
        const isMissing = missing.has(token);
        /* 已知缺失的图片不再发请求，直接显示编号占位 */
        const imgTag = isMissing
            ? ''
            : `<img class="avatar-lib-img" src="${AVATAR_LIBRARY_DIR}${token}" alt="${token}" loading="lazy" decoding="async">`;
        libraryTiles += `
            <button type="button" class="avatar-choice avatar-lib-item ${current === token ? 'active' : ''} ${isMissing ? 'missing' : ''}" data-avatar="${token}" title="${token}">
                ${imgTag}
                <span class="avatar-lib-fallback">${i}</span>
            </button>`;
    }

    box.innerHTML = `
        <div class="avatar-dialog-section">
            <div class="avatar-dialog-subtitle">${t('user.avatarEmojiSection')}</div>
            <div class="avatar-emoji-grid">${emojiButtons}</div>
        </div>
        <div class="avatar-dialog-section">
            <div class="avatar-dialog-subtitle">
                ${t('user.avatarLibrary')}（${AVATAR_LIBRARY_COUNT}）
                <button type="button" class="btn btn-small" id="avatar-rescan-btn">${t('user.avatarRescan')}</button>
            </div>
            <div class="avatar-lib-grid">${libraryTiles}</div>
        </div>
    `;

    bindAvatarPicker(box);
}

/* 绑定选择器事件（PNG 缺失时优雅降级为编号占位） */
function bindAvatarPicker(root) {
    /* 用户中心里的「选择头像」按钮 */
    const openBtn = root.querySelector('#avatar-open-btn');
    if (openBtn) openBtn.onclick = () => openAvatarDialog();

    /* 弹窗内：重新检测 */
    const rescan = root.querySelector('#avatar-rescan-btn');
    if (rescan) {
        rescan.onclick = () => {
            clearAvatarMissingCache();
            renderAvatarDialogBody();
            showNotification(t('user.avatarLibrary'), t('user.avatarRescanDone'), 'info');
        };
    }

    /* 图片加载失败 → 占位（并记入会话缓存，避免反复 404） */
    const markItemMissing = (img) => {
        const item = img.closest('.avatar-lib-item');
        if (item) {
            item.classList.add('missing');
            markAvatarMissing(item.dataset.avatar || '');
        }
    };
    root.querySelectorAll('.avatar-lib-img').forEach((img) => {
        img.addEventListener('error', () => markItemMissing(img));
        if (img.complete && img.naturalWidth === 0) markItemMissing(img);
    });

    /* 点击某个头像 → 立即生效并关闭弹窗 */
    root.querySelectorAll('.avatar-choice').forEach((btn) => {
        btn.onclick = () => {
            setUserAvatar(btn.dataset.avatar || '');
            closeAvatarDialog();
            if (typeof renderUserDialog === 'function') renderUserDialog();
            showNotification(t('notifications.avatarSaved'), '', 'success');
        };
    });
}

/* -------- 缓存存档摘要（起始屏显示「检测到缓存」用） -------- */

function getCachedSaveSummary() {
    try {
        const raw = localStorage.getItem(typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'farm_game_save_v1');
        if (!raw) return null;
        const data = safeJSONParse(raw, null);
        if (!data) return null;
        return {
            day: data.day || 1,
            level: data.level || 1,
            gold: data.gold || 0,
            nickname: (data.user && data.user.nickname) || '',
        };
    } catch (e) {
        return null;
    }
}
