/* ============================================================
   settingsUI.js  —  设置 / 用户中心 / 规则 / 货币兑换
   ============================================================ */

function openSettings() {
    const dlg = document.getElementById('settings-dialog');
    if (dlg) dlg.classList.add('show');
    renderSettings();
}

function closeSettings() {
    const dlg = document.getElementById('settings-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderSettings() {
    const box = document.getElementById('settings-body');
    if (!box) return;
    const s = gameState.settings;
    box.innerHTML = `
        <div class="settings-section">
            <div class="settings-section-title">${t('settings.audio')}</div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.bgm')}</div>
                <div class="settings-control"><button class="toggle-switch ${s.bgmEnabled ? 'on' : ''}" data-key="bgmEnabled"></button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.sfx')}</div>
                <div class="settings-control"><button class="toggle-switch ${s.sfxVolume > 0 ? 'on' : ''}" data-key="sfx"></button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.browserNotify')}</div>
                <div class="settings-control"><button class="toggle-switch ${s.browserNotify ? 'on' : ''}" data-key="browserNotify"></button></div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-section-title">${t('settings.display')}</div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.effects')}</div>
                <div class="settings-control"><button class="toggle-switch ${s.effectsEnabled ? 'on' : ''}" data-key="effectsEnabled"></button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.layout')}</div>
                <div class="settings-control">
                    <select class="settings-select" data-key="displayMode">
                        <option value="auto" ${s.displayMode === 'auto' ? 'selected' : ''}>${t('settings.auto')}</option>
                        <option value="desktop" ${s.displayMode === 'desktop' ? 'selected' : ''}>${t('settings.desktop')}</option>
                        <option value="mobile" ${s.displayMode === 'mobile' ? 'selected' : ''}>${t('settings.mobile')}</option>
                    </select>
                </div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.language')}</div>
                <div class="settings-control">
                    <select class="settings-select" data-key="language">
                        <option value="auto" ${s.language === 'auto' ? 'selected' : ''}>${t('settings.browserDefault')}</option>
                        <option value="zh" ${s.language === 'zh' ? 'selected' : ''}>中文</option>
                        <option value="en" ${s.language === 'en' ? 'selected' : ''}>English</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-section-title">${t('settings.save')}</div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.saveNow')}</div>
                <div class="settings-control"><button class="btn btn-small" id="settings-save-btn">${t('common.save')}</button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.exportSave')}</div>
                <div class="settings-control"><button class="btn btn-small" id="settings-export-btn">${t('common.export')}</button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.importSave')}</div>
                <div class="settings-control"><button class="btn btn-small" id="settings-import-btn">${t('common.import')}</button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.resetGame')}</div>
                <div class="settings-control"><button class="btn btn-small btn-danger" id="settings-reset-btn">${t('common.reset')}</button></div>
            </div>
        </div>
        <div class="settings-section">
            <div class="settings-section-title">${t('settings.other')}</div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.rules')}</div>
                <div class="settings-control"><button class="btn btn-small" id="settings-rules-btn">${t('settings.viewRules')}</button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.backToTitle')}</div>
                <div class="settings-control"><button class="btn btn-small" id="settings-title-btn">${t('settings.backToTitleBtn')}</button></div>
            </div>
            <div class="settings-item">
                <div class="settings-item-label">${t('settings.version')}</div>
                <div class="settings-control" style="font-family:monospace">v${GAME_VERSION}</div>
            </div>
        </div>
    `;

    /* 绑定 */
    box.querySelectorAll('.toggle-switch').forEach(el => {
        el.onclick = () => {
            const key = el.dataset.key;
            if (key === 'bgmEnabled') {
                gameState.settings.bgmEnabled = !gameState.settings.bgmEnabled;
                if (gameState.settings.bgmEnabled && typeof audio !== 'undefined') audio.playBgm();
                else if (typeof audio !== 'undefined') audio.pauseBgm();
            } else if (key === 'sfx') {
                gameState.settings.sfxVolume = gameState.settings.sfxVolume > 0 ? 0 : SFX_VOLUME_DEFAULT;
            } else if (key === 'effectsEnabled') {
                gameState.settings.effectsEnabled = !gameState.settings.effectsEnabled;
                document.documentElement.classList.toggle('fx-off', !gameState.settings.effectsEnabled);
            } else if (key === 'browserNotify') {
                if (typeof notify !== 'undefined' && notify.isAvailable()) {
                    if (!gameState.settings.browserNotify) {
                        notify.requestPermission().then((granted) => {
                            gameState.settings.browserNotify = granted;
                            renderSettings();
                            markDirty();
                        });
                        return;
                    }
                    gameState.settings.browserNotify = false;
                }
            }
            renderSettings();
            markDirty();
        };
    });
    const displayModeSelect = box.querySelector('select[data-key="displayMode"]');
    if (displayModeSelect) {
        displayModeSelect.onchange = (e) => {
            gameState.settings.displayMode = e.target.value;
            if (typeof layout !== 'undefined') layout.setMode(e.target.value);
            markDirty();
        };
    }
    const languageSelect = box.querySelector('select[data-key="language"]');
    if (languageSelect) {
        languageSelect.onchange = (e) => {
            const locale = e.target.value || 'auto';
            // 优先调用全局语言控制；它会立即刷新整个 UI，并在必要时重载页面以切换数据文件
            if (window.languageControl && typeof window.languageControl.setLanguage === 'function') {
                window.languageControl.setLanguage(locale);
            } else if (typeof setLanguage === 'function') {
                setLanguage(locale);
            } else {
                gameState.settings.language = locale;
                if (typeof renderGame === 'function') renderGame();
                if (typeof applyStaticTextTranslations === 'function') applyStaticTextTranslations();
            }
            if (typeof renderSettings === 'function') renderSettings();
            markDirty();
        };
    }
    const saveBtn = document.getElementById('settings-save-btn');
    if (saveBtn) saveBtn.onclick = () => manualSave();
    const exportBtn = document.getElementById('settings-export-btn');
    if (exportBtn) exportBtn.onclick = () => showExportDialog();
    const importBtn = document.getElementById('settings-import-btn');
    if (importBtn) importBtn.onclick = () => showImportDialog();
    const resetBtn = document.getElementById('settings-reset-btn');
    if (resetBtn) resetBtn.onclick = async () => {
        const ok = await resetSave(true);
        if (ok) { location.reload(); }
    };
    const rulesBtn = document.getElementById('settings-rules-btn');
    if (rulesBtn) rulesBtn.onclick = () => openRulesDialog();

    /* 返回标题界面：下次启动显示起始选择弹窗（不会删除存档） */
    const titleBtn = document.getElementById('settings-title-btn');
    if (titleBtn) {
        titleBtn.onclick = async () => {
            const ok = await showConfirm(t('settings.backToTitle'), t('settings.backToTitleBody'));
            if (!ok) return;
            try {
                localStorage.setItem(FORCE_START_SCREEN_KEY, '1');
                if (typeof saveGame === 'function') saveGame(true);
            } catch (e) { /* ignore */ }
            location.reload();
        };
    }
}

/* 规则文档渲染统一由 legalDialog.js 提供（内联数据，无需 fetch） */
function openRulesDialog() {
    if (typeof openLegalDoc === 'function') {
        openLegalDoc('rules-dialog', 'rules-body', 'rules');
        return;
    }
    const d = document.getElementById('rules-dialog');
    if (d) d.classList.add('show');
}

function tryParseRulesContent(rawText) {
    try {
        const parsed = JSON.parse(rawText);
        if (typeof parsed === 'string') return parsed;
        if (parsed && typeof parsed.content === 'string') return parsed.content;
        if (parsed && typeof parsed.text === 'string') return parsed.text;
        if (parsed && typeof parsed.rules === 'string') return parsed.rules;
        return String(rawText);
    } catch (e) {
        return rawText;
    }
}

function markdownToHtml(markdown) {
    const escapeHtml = (value = '') => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const lines = markdown.replace(/\r/g, '').split('\n');
    const blocks = [];
    let current = [];

    for (const line of lines) {
        if (!line.trim()) {
            if (current.length) {
                blocks.push(current.join('\n'));
                current = [];
            }
            continue;
        }
        current.push(line);
    }
    if (current.length) blocks.push(current.join('\n'));

    return blocks.map(block => {
        /* 水平线 */
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(block.trim())) return '<hr>';
        if (/^#{1,6}\s+/.test(block)) {
            const m = block.match(/^(#{1,6})\s+(.*)$/);
            if (m) {
                const level = m[1].length;
                return `<h${level}>${escapeHtml(m[2])}</h${level}>`;
            }
        }

        if (/^[-*]\s+/.test(block)) {
            const items = block.split('\n')
                .filter(line => /^[-*]\s+/.test(line))
                .map(line => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ''))}</li>`)
                .join('');
            return `<ul>${items}</ul>`;
        }

        const paragraphs = block.split('\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
        return paragraphs;
    }).join('');
}

/* -------- 用户中心 -------- */
function openUserDialog() {
    const dlg = document.getElementById('user-dialog');
    if (dlg) dlg.classList.add('show');
    renderUserDialog();
}

function renderUserDialog() {
    const box = document.getElementById('user-body');
    if (!box) return;
    const u = gameState.user;
    const stats = gameState.stats;

    box.innerHTML = `
        <div class="user-profile-header">
            <div class="user-avatar-large" id="user-avatar-clickable" data-i18n-tip="ui.tip.changeAvatar" title="${t('user.changeAvatarHint')}">${getUserAvatarHtml(u.avatar, '👤', 'avatar-img-lg')}</div>
            <div class="user-nickname-edit">
                <input type="text" id="user-nickname-input" value="${u.nickname}" maxlength="${NICKNAME_MAX_LEN}"
                       placeholder="${t('user.nicknameDefault')}">
            </div>
            <div class="user-nickname-hint">${t('user.nicknameLimit', { max: NICKNAME_MAX_LEN })}</div>
            <div class="user-id-display">${t('user.id')}: ${u.userId || '—'}</div>
        </div>

        ${renderAvatarPickerHtml()}

        <div class="user-profile-actions">
            <label class="btn btn-small" for="avatar-upload-input" data-i18n-tip="ui.tip.changeAvatar">${t('user.uploadAvatar')}</label>
            <input id="avatar-upload-input" type="file" accept="image/*" class="hidden-file-input" />
            <button type="button" class="btn btn-small btn-danger" id="avatar-remove-btn">${t('user.removeAvatar')}</button>
        </div>

        <div class="user-stats-grid">
            <div class="user-stat-card"><div class="user-stat-label">${t('user.level')}</div><div class="user-stat-value">${gameState.level}</div></div>
            <div class="user-stat-card"><div class="user-stat-label">${t('user.day')}</div><div class="user-stat-value">${gameState.day}</div></div>
            <div class="user-stat-card"><div class="user-stat-label">${t('user.gold')}</div><div class="user-stat-value">${formatNumber(gameState.gold)}</div></div>
            <div class="user-stat-card"><div class="user-stat-label">${t('user.harvest')}</div><div class="user-stat-value">${stats.totalHarvests || 0}</div></div>
            <div class="user-stat-card"><div class="user-stat-label">${t('user.factory')}</div><div class="user-stat-value">${stats.totalFactoriesRun || 0}</div></div>
            <div class="user-stat-card"><div class="user-stat-label">${t('user.achievement')}</div><div class="user-stat-value">${getAchievementProgress().unlocked}</div></div>
        </div>
    `;

    /* 昵称 */
    const input = document.getElementById('user-nickname-input');
    if (input) {
        input.onchange = () => {
            const v = input.value.trim().slice(0, NICKNAME_MAX_LEN) || t('user.nicknameDefault');
            gameState.user.nickname = v;
            input.value = v;
            markDirty();
            _saveUserMeta();
            showNotification(t('notifications.save'), '', 'success');
            renderUserAvatar();
        };
    }

    /* 头像素材库 / emoji */
    bindAvatarPicker(box);

    /* 自定义上传（只有这种才需要 base64） */
    const avatarInput = document.getElementById('avatar-upload-input');
    if (avatarInput) {
        avatarInput.onchange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const dataUrl = await resizeAvatarFile(file);
            if (!dataUrl) {
                showAlert(t('user.saveAvatarFail'), t('user.saveAvatarFailReason'));
                return;
            }
            setUserAvatar(dataUrl);
            renderUserDialog();
            showNotification(t('notifications.avatarSaved'), '', 'success');
        };
    }

    /* 移除头像 */
    const removeBtn = document.getElementById('avatar-remove-btn');
    if (removeBtn) {
        removeBtn.onclick = () => {
            setUserAvatar('');
            renderUserDialog();
            showNotification(t('notifications.avatarDeleted'), '', 'success');
        };
    }

    /* 点头像 = 打开文件选择器 */
    const avatarEl = document.getElementById('user-avatar-clickable');
    if (avatarEl) {
        avatarEl.onclick = () => {
            const ai = document.getElementById('avatar-upload-input');
            if (ai) ai.click();
        };
        avatarEl.setAttribute('data-hover-tip', t('user.changeAvatarHint'));
    }
}

function renderUserAvatar() {
    const display = document.getElementById('user-avatar-display');
    if (display) {
        display.innerHTML = getUserAvatarHtml(gameState.user.avatar, '👤', 'avatar-img-hud');
    }
    /* 用户中心里的头像预览（打开时） */
    const big = document.getElementById('user-avatar-clickable');
    if (big) {
        big.innerHTML = getUserAvatarHtml(gameState.user.avatar, '👤', 'avatar-img-lg');
    }
}

function initSettingsUI() {
    const closeBtn = document.querySelector('#settings-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeSettings;
    const closeRules = document.querySelector('#rules-dialog .close-btn');
    if (closeRules) closeRules.onclick = () => document.getElementById('rules-dialog').classList.remove('show');
    const closeUser = document.querySelector('#user-dialog .close-btn');
    if (closeUser) closeUser.onclick = () => document.getElementById('user-dialog').classList.remove('show');

    /* 首帧时若设置里特效关了就加 class */
    if (!gameState.settings.effectsEnabled) {
        document.documentElement.classList.add('fx-off');
    }
}