/* ============================================================
   rightClickTip.js  —  按钮右键上下文提示
   - 任何带有 data-i18n-tip 属性的元素：
       鼠标 hover 时小气泡提示；
       右键点击时不弹浏览器菜单，弹出大一点的内容气泡。
   - 跟随 t() 当前语言，无 i18n key 时回退到 data-i18n-tip 原始值。
   - 与已有的 data-i18n-title 互不影响。
   ============================================================ */

(function () {
    let popup = null;
    let hideTimer = null;
    let lastTrigger = null;

    function ensurePopup() {
        if (popup) return popup;
        popup = document.getElementById('btn-tip-popup');
        return popup;
    }

    function resolveTipText(el) {
        const key = el && el.dataset ? el.dataset.i18nTip : null;
        if (!key) return '';
        if (typeof t === 'function') {
            const v = t(key);
            if (v && v !== key) return v;
        }
        return key;
    }

    function showAt(x, y, text) {
        const p = ensurePopup();
        if (!p || !text) return;
        clearTimeout(hideTimer);
        p.textContent = text;
        p.classList.add('show');
        p.setAttribute('aria-hidden', 'false');

        /* 先放在屏幕外测量尺寸再放回，避免初次出现时偏移 */
        p.style.left = '-9999px';
        p.style.top  = '-9999px';
        requestAnimationFrame(() => {
            const rect = p.getBoundingClientRect();
            const margin = 12;
            let nx = x + 14;
            let ny = y + 14;
            if (nx + rect.width  > window.innerWidth  - margin) nx = x - rect.width  - 14;
            if (ny + rect.height > window.innerHeight - margin) ny = y - rect.height - 14;
            if (nx < margin) nx = margin;
            if (ny < margin) ny = margin;
            p.style.left = nx + 'px';
            p.style.top  = ny + 'px';
        });
    }

    function scheduleHide(delay = 120) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            if (popup) {
                popup.classList.remove('show');
                popup.setAttribute('aria-hidden', 'true');
            }
        }, delay);
    }

    function attach() {
        /* 用 mouseover / mouseout 委托所有带 data-i18n-tip 的元素（包含动态创建）*/
        document.addEventListener('mouseover', (e) => {
            const el = e.target.closest('[data-i18n-tip]');
            if (!el || el === lastTrigger) return;
            lastTrigger = el;
            const text = resolveTipText(el);
            if (!text) return;
            const r = el.getBoundingClientRect();
            showAt(r.left, r.bottom, text);
        });

        document.addEventListener('mouseout', (e) => {
            const el = e.target.closest('[data-i18n-tip]');
            if (!el) return;
            const next = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-i18n-tip]') : null;
            if (next === el) return;
            if (!next) {
                lastTrigger = null;
                scheduleHide();
            } else {
                lastTrigger = next;
                const text = resolveTipText(next);
                if (!text) { scheduleHide(); return; }
                const r = next.getBoundingClientRect();
                showAt(r.left, r.bottom, text);
            }
        });

        /* 右键：阻止浏览器菜单，显示大一点的弹窗 */
        document.addEventListener('contextmenu', (e) => {
            const el = e.target.closest('[data-i18n-tip]');
            if (!el) return;
            e.preventDefault();
            const text = resolveTipText(el);
            if (!text) return;
            showAt(e.clientX, e.clientY, text);
            clearTimeout(hideTimer);
            /* 右键弹窗需要点别处才能关 */
            setTimeout(() => {
                const onClick = (ev) => {
                    if (popup && !popup.contains(ev.target)) {
                        scheduleHide(0);
                        document.removeEventListener('mousedown', onClick, true);
                        document.removeEventListener('keydown', onEsc, true);
                    }
                };
                const onEsc = (ev) => {
                    if (ev.key === 'Escape') {
                        scheduleHide(0);
                        document.removeEventListener('mousedown', onClick, true);
                        document.removeEventListener('keydown', onEsc, true);
                    }
                };
                document.addEventListener('mousedown', onClick, true);
                document.addEventListener('keydown', onEsc, true);
            }, 0);
        });

        /* 滚动或窗口变化时关闭 */
        window.addEventListener('scroll', () => scheduleHide(0), true);
        window.addEventListener('resize', () => scheduleHide(0));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
})();