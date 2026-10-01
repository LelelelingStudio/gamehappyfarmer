/* ============================================================
   currencyDialog.js  —  货币详情弹窗
   - 顶部金币点击 → 弹出 5 级货币余额 + 兑换（上下）+ 帮助
   - 依赖：currencySystem.js（CURRENCIES、exchangeUp/Down、getCurrencyBalance 等）
   - 完全多语言：所有文案走 t('currency.*')
   ============================================================ */

function openCurrencyDialog() {
    const dlg = document.getElementById('currency-dialog');
    if (!dlg) return;
    dlg.classList.add('show');
    renderCurrencyDialog();
}

function closeCurrencyDialog() {
    const dlg = document.getElementById('currency-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderCurrencyDialog() {
    const box = document.getElementById('currency-body');
    if (!box) return;
    box.innerHTML = `
        <div class="currency-simple">
            <div class="currency-simple-balance">${formatNumber(gameState.gold)} 💰</div>
            <p class="currency-simple-note">${t('currency.unifiedNote')}</p>
        </div>
    `;
}

function renderCurrencyHistory() {
    const list = (gameState && Array.isArray(gameState.currencyHistory)) ? gameState.currencyHistory.slice().reverse().slice(0, 20) : [];
    if (list.length === 0) {
        return `<div class="currency-history-empty">${t('currency.historyEmpty')}</div>`;
    }
    return list.map(item => {
        const fromCur = (typeof getCurrencyById === 'function') ? getCurrencyById(item.from) : null;
        const toCur   = (typeof getCurrencyById === 'function') ? getCurrencyById(item.to)   : null;
        const time = new Date(item.time).toLocaleString();
        if (!fromCur || !toCur) return '';
        const arrow = item.type === 'up' ? '↑' : '↓';
        return `<div class="currency-history-row"><span>${time}</span> <span>${formatNumber(item.fromAmount)} ${escapeHtmlText(fromCur.name)} ${arrow} ${formatNumber(item.toAmount)} ${escapeHtmlText(toCur.name)}</span></div>`;
    }).join('');
}

async function handleExchange(currencyId, direction) {
    if (typeof exchangeUp !== 'function' || typeof exchangeDown !== 'function') return;

    const cur = (typeof getCurrencyById === 'function') ? getCurrencyById(currencyId) : null;
    if (!cur) return;

    if (direction === 'up' && cur.level <= 1) {
        showNotification(t('currency.cannotUpgrade'), '', 'warning');
        return;
    }
    if (direction === 'down' && cur.level >= 5) {
        showNotification(t('currency.cannotDowngrade'), '', 'warning');
        return;
    }

    /* 计算默认数量 */
    let defaultAmount = 1;
    if (direction === 'up') {
        const lower = (typeof getCurrencyByLevel === 'function') ? getCurrencyByLevel(cur.level - 1) : null;
        const lowerBal = lower ? (typeof getCurrencyBalance === 'function' ? getCurrencyBalance(lower.id) : 0) : 0;
        if (lower && typeof CURRENCY_UP_RATE !== 'undefined' && CURRENCY_UP_RATE > 0) {
            defaultAmount = Math.max(1, Math.floor(lowerBal / CURRENCY_UP_RATE));
            if (defaultAmount > 100) defaultAmount = 100;
        }
    } else {
        const bal = (typeof getCurrencyBalance === 'function') ? getCurrencyBalance(currencyId) : 0;
        defaultAmount = Math.max(1, Math.min(100, Math.floor(bal)));
    }

    const amountStr = await showPrompt(
        t('currency.confirmExchange'),
        t('currency.amount'),
        String(defaultAmount),
        '1'
    );
    if (amountStr == null) return;
    const amount = Math.max(1, parseInt(amountStr, 10) || 1);

    let result;
    if (direction === 'up') {
        result = exchangeUp(currencyId, amount);
    } else {
        result = exchangeDown(currencyId, amount);
    }

    if (result && result.ok) {
        showNotification(t('currency.confirmExchange'), `${direction === 'up' ? '↑' : '↓'} ${amount} ${cur.name}`, 'success');
        if (typeof renderGame === 'function') renderGame();
        renderCurrencyDialog();
    } else {
        showAlert(
            direction === 'up' ? t('currency.exchangeUp') : t('currency.exchangeDown'),
            (result && result.reason) ? result.reason : t('currency.insufficientFunds')
        );
    }
}

/* HUD 金币点击绑定 */
function bindGoldStatClick() {
    const el = document.getElementById('gold-stat');
    if (!el) return;
    el.style.cursor = 'pointer';
    el.onclick = (e) => {
        e.preventDefault();
        openCurrencyDialog();
    };
}

function escapeHtmlText(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* 关闭按钮（initCurrencyDialogUI） */
function initCurrencyDialogUI() {
    const closeBtn = document.querySelector('#currency-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeCurrencyDialog;
    bindGoldStatClick();
}