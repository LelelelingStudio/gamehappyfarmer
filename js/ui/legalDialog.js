/* ============================================================
   legalDialog.js  —  游戏规则 / 隐私政策 / 服务条款 弹窗
   ------------------------------------------------------------
   文档数据来自 langdata/<locale>/documents-<locale>.js（JS 内联，
   见 window.DOCUMENT_PACKS）。不使用 fetch，
   因此 file:// 双击打开、离线、以及未来内嵌进 App 都能正常显示。
   ============================================================ */

/* 文档种类 → DOCUMENT_PACKS 中的字段名 */
const LEGAL_DOC_KINDS = ['rules', 'privacy', 'terms'];

/* -------- 取当前语言的文档对象（缺失时回退到中文） -------- */
function getLegalDocument(kind) {
    const packs = window.DOCUMENT_PACKS || {};
    const localeKey = (window.languageControl && typeof window.languageControl.getCurrentLocaleKey === 'function')
        ? window.languageControl.getCurrentLocaleKey()
        : (window.currentLocale || 'zh');
    const primary = packs[localeKey] || packs.zh || null;
    const fallback = packs.zh || null;
    const pick = (pack) => (pack && typeof pack === 'object' && pack[kind]) ? pack[kind] : null;
    return pick(primary) || pick(fallback) || null;
}

/* -------- 把文档渲染进指定容器（无数据时给出可读的兜底提示） -------- */
function renderLegalDocInto(bodyEl, kind) {
    if (!bodyEl) return false;

    const doc = getLegalDocument(kind);
    let content = '';
    if (doc && typeof doc.content === 'string') {
        content = doc.content;
    } else if (typeof doc === 'string') {
        content = doc;
    }

    if (!content) {
        bodyEl.innerHTML = '<h2>' + t('save.rulesUnavailableTitle') + '</h2><p>' + t('save.rulesUnavailableBody') + '</p>';
        return false;
    }

    bodyEl.innerHTML = (typeof markdownToHtml === 'function')
        ? markdownToHtml(content)
        : '<pre>' + escapeForPre(content) + '</pre>';
    return true;
}

/* -------- 打开某个文档弹窗 -------- */
function openLegalDoc(dialogId, bodyId, kind) {
    const dlg = document.getElementById(dialogId);
    const body = document.getElementById(bodyId);
    if (!dlg) return;
    dlg.classList.add('show');
    if (body) {
        body.scrollTop = 0;
        body.innerHTML = '<div class="rules-loading">' + t('settings.loadingRules') + '</div>';
    }
    /* 渲染是同步的，放到下一帧只是为了让“加载中”有机会显示 */
    requestAnimationFrame(() => renderLegalDocInto(body, kind));
}

function openRulesDialog() {
    openLegalDoc('rules-dialog', 'rules-body', 'rules');
}

function openPrivacyDialog() {
    openLegalDoc('privacy-dialog', 'privacy-body', 'privacy');
}

function openTermsDialog() {
    openLegalDoc('terms-dialog', 'terms-body', 'terms');
}

/* -------- 事件绑定（幂等：重复调用只会覆盖同一个 onclick） -------- */
function initLegalDialog() {
    const bind = (id, handler) => {
        const el = document.getElementById(id);
        if (el) el.onclick = handler;
    };

    /* 起始屏 */
    bind('start-rules-btn', openRulesDialog);
    bind('start-privacy-btn', openPrivacyDialog);
    bind('start-terms-btn', openTermsDialog);

    /* 设置面板 / 用户中心（如存在） */
    bind('settings-rules-btn', openRulesDialog);
    bind('settings-privacy-btn', openPrivacyDialog);
    bind('settings-terms-btn', openTermsDialog);
    bind('user-privacy-btn', openPrivacyDialog);
}

function escapeForPre(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
