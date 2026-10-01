/* ============================================================
   modal.js  —  通用弹窗系统
   替代 alert / prompt / confirm
   版本：v1.0.1
   ============================================================ */

/* 当前打开的弹窗栈（支持嵌套） */
const _modalStack = [];

/* ============================================================
   核心：showModal
   @param {string} title        标题
   @param {string} message      正文（支持 HTML）
   @param {Array}  buttons      按钮数组
     [{ text, value, primary, danger }]
   @param {object} options      可选配置
     { inputType, inputValue, inputPlaceholder, allowClose, width }
   @returns {Promise<any>}      resolve 为所点按钮的 value
   ============================================================ */
function showModal(title, message, buttons = null, options = {}) {
    return new Promise((resolve) => {

        if (!buttons || buttons.length === 0) {
            buttons = [{ text: t('common.ok'), value: 'ok', primary: true }];
        }

        const allowClose = options.allowClose !== false;

        /* -------- 遮罩 -------- */
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        /* -------- 弹窗盒 -------- */
        const box = document.createElement('div');
        box.className = 'modal-box';
        if (options.width) box.style.maxWidth = options.width;

        /* -------- 标题 -------- */
        const h2 = document.createElement('h2');
        h2.textContent = title;
        box.appendChild(h2);

        /* -------- 正文 -------- */
        if (message !== undefined && message !== null && message !== '') {
            const p = document.createElement('p');
            p.innerHTML = message;
            box.appendChild(p);
        }

        /* -------- 输入框（可选） -------- */
        let inputEl = null;
        if (options.inputType) {
            inputEl = document.createElement('input');
            inputEl.type = options.inputType;
            inputEl.value = options.inputValue || '';
            inputEl.placeholder = options.inputPlaceholder || '';
            if (options.inputType === 'number') {
                if (options.inputMin !== undefined) inputEl.min = options.inputMin;
                if (options.inputMax !== undefined) inputEl.max = options.inputMax;
                if (options.inputStep !== undefined) inputEl.step = options.inputStep;
            }
            box.appendChild(inputEl);
        }

        /* -------- 按钮组 -------- */
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        buttons.forEach((btnConf) => {
            const btn = document.createElement('button');
            btn.textContent = btnConf.text;
            if (btnConf.primary) btn.classList.add('primary');
            if (btnConf.danger) btn.classList.add('danger');

            btn.onclick = () => {
                /* 输入框类型返回输入值 */
                let result;
                if (inputEl) {
                    result = {
                        value: btnConf.value !== undefined ? btnConf.value : btnConf.text,
                        input: inputEl.value,
                    };
                } else {
                    result = btnConf.value !== undefined ? btnConf.value : btnConf.text;
                }
                _closeModal(overlay, resolve, result);
            };

            actions.appendChild(btn);
        });
        box.appendChild(actions);

        /* -------- 关闭按钮（右上角 ×） -------- */
        if (allowClose) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    _closeModal(overlay, resolve, null);
                }
            });
            document.addEventListener('keydown', _escHandlerFactory(overlay, resolve), { once: false });
        }

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        /* -------- 焦点管理（防背景滚动） -------- */
        _modalStack.push({
            overlay,
            prevOverflow: document.body.style.overflow,
        });
        document.body.style.overflow = 'hidden';

        /* -------- 自动聚焦 -------- */
        setTimeout(() => {
            if (inputEl) {
                inputEl.focus();
                if (inputEl.select) inputEl.select();
            } else {
                const firstBtn = actions.querySelector('button');
                if (firstBtn) firstBtn.focus();
            }
        }, 50);
    });
}

/* ============================================================
   内部：关闭弹窗
   ============================================================ */
function _closeModal(overlay, resolve, result) {
    overlay.classList.add('closing');
    setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

        /* 恢复 body 滚动 */
        const top = _modalStack[_modalStack.length - 1];
        if (top && top.overlay === overlay) {
            _modalStack.pop();
            if (_modalStack.length === 0) {
                document.body.style.overflow = top.prevOverflow || '';
            }
        }

        resolve(result);
    }, 180);
}

/* ============================================================
   ESC 键处理
   ============================================================ */
function _escHandlerFactory(overlay, resolve) {
    return function escHandler(e) {
        if (e.key === 'Escape' && document.body.contains(overlay)) {
            document.removeEventListener('keydown', escHandler);
            _closeModal(overlay, resolve, null);
        }
    };
}

/* ============================================================
   语法糖
   ============================================================ */

/**
 * 确认弹窗，返回 true / false
 */
function showConfirm(title, message, confirmText = t('common.ok'), cancelText = t('common.cancel')) {
    return showModal(title, message, [
        { text: cancelText, value: false },
        { text: confirmText, value: true, primary: true },
    ]).then(v => v === true);
}

/**
 * 危险确认（红色按钮）
 */
function showDangerConfirm(title, message, confirmText = t('common.delete'), cancelText = t('common.cancel')) {
    return showModal(title, message, [
        { text: cancelText, value: false },
        { text: confirmText, value: true, danger: true },
    ]).then(v => v === true);
}

/**
 * 输入弹窗，返回 { value, input } 或 null
 */
function showPrompt(title, message, defaultValue = '', inputType = 'text', placeholder = '') {
    return showModal(title, message, [
        { text: t('common.cancel'), value: null },
        { text: t('common.ok'), value: 'ok', primary: true },
    ], {
        inputType,
        inputValue: defaultValue,
        inputPlaceholder: placeholder,
    }).then(result => {
        if (result === null) return null;
        return result.input;
    });
}

/**
 * 数字输入弹窗，返回数字或 null
 */
function showNumberPrompt(title, message, defaultValue = 1, min = 1, max = 9999) {
    return showModal(title, message, [
        { text: t('common.cancel'), value: null },
        { text: t('common.ok'), value: 'ok', primary: true },
    ], {
        inputType: 'number',
        inputValue: defaultValue,
        inputMin: min,
        inputMax: max,
        inputStep: 1,
    }).then(result => {
        if (result === null) return null;
        const n = parseInt(result.input, 10);
        if (isNaN(n)) return null;
        return clamp(n, min, max);
    });
}

/**
 * 纯提示弹窗（只有一个"确定"按钮）
 */
function showAlert(title, message) {
    return showModal(title, message, [
        { text: t('common.ok'), value: 'ok', primary: true },
    ]);
}

/**
 * 关闭所有弹窗（比如重置游戏时）
 */
function closeAllModals() {
    while (_modalStack.length > 0) {
        const top = _modalStack.pop();
        if (top.overlay.parentNode) top.overlay.parentNode.removeChild(top.overlay);
        document.body.style.overflow = top.prevOverflow || '';
    }
}

/* ============================================================
   全局替换原生 alert / prompt / confirm（防止遗漏）
   ============================================================ */
window.alert = function (msg) {
    showAlert(t('notifications.prompt'), String(msg));
};

window.confirm = function (msg) {
    /* 同步弹窗无法做到，返回 true 会出问题，改为异步提示后返回 false */
    showConfirm(t('common.confirm'), String(msg)).then(result => {
        if (result) {
            console.warn('原生 confirm 已被替换，异步确认结果为 true，但原调用点无法接收');
        }
    });
    return false;
};