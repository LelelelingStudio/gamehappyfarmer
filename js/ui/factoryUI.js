/* ============================================================
   factoryUI.js  —  加工厂
   ============================================================ */

let _factoryTab = 'available';
let _factoryLevelFilter = 'all';
let _factorySearch = '';

function openFactory() {
    const dlg = document.getElementById('factory-dialog');
    if (dlg) dlg.classList.add('show');
    renderFactory();
}

function closeFactory() {
    const dlg = document.getElementById('factory-dialog');
    if (dlg) dlg.classList.remove('show');
}

function renderFactory() {
    renderFactoryLevelFilters();
    renderFactorySearch();
    renderFactoryTabs();

    if (_factoryTab === 'available') renderFactoryAvailable();
    else if (_factoryTab === 'processing') renderFactoryProcessing();
    else renderFactoryCompleted();
}

function renderFactoryLevelFilters() {
    const box = document.getElementById('factory-level-filters');
    if (!box) return;
    const levels = ['all', 1, 2, 3, 4, 5, 6, 7, 8, 9];
    box.innerHTML = levels.map(l => 
        `<button class="level-filter-btn ${_factoryLevelFilter === l ? 'active' : ''}" data-lv="${l}">${l === 'all' ? t('common.all') : t('common.level', { level: l })}</button>`
    ).join('');
    box.querySelectorAll('.level-filter-btn').forEach(btn => {
        btn.onclick = () => {
            _factoryLevelFilter = btn.dataset.lv === 'all' ? 'all' : Number(btn.dataset.lv);
            renderFactory();
        };
    });
}

function renderFactorySearch() {
    const input = document.getElementById('factory-search-input');
    if (!input || input._bound) return;
    input._bound = true;
    input.oninput = () => {
        _factorySearch = input.value.trim();
        if (_factoryTab === 'available') renderFactoryAvailable();
    };
}

function renderFactoryTabs() {
    document.querySelectorAll('.factory-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === _factoryTab);
        tab.onclick = () => {
            _factoryTab = tab.dataset.tab;
            renderFactory();
        };
    });
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    if (_factoryTab === 'available') {
        document.getElementById('available-products')?.classList.add('active');
    } else if (_factoryTab === 'processing') {
        document.getElementById('processing-products')?.classList.add('active');
    } else {
        document.getElementById('completed-products')?.classList.add('active');
    }
}

function renderFactoryAvailable() {
    const box = document.getElementById('available-products');
    if (!box) return;

    let list = getAvailableFactoryProducts(gameState.level);
    if (_factoryLevelFilter !== 'all') list = list.filter(p => p.level === _factoryLevelFilter);
    if (_factorySearch) {
        const kw = _factorySearch.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(kw));
    }
    list = list.slice(0, 40);

    if (list.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noFactory') + '</div>';
        return;
    }

    box.innerHTML = list.map(p => {
        const check = checkMaterials(p.id, 1);
        const can = check.ok && gameState.gold >= p.processingCost;
        /* 需求项既可能是作物（cropId），也可能是加工品（productId），统一解析 */
        const ingredients = (p.requirements || []).map(r => resolveFactoryIngredient(r));
        const totalReqs = ingredients.length;
        const finishedReqs = ingredients.filter(ing => ing && getStorageCount(ing.name) >= ing.amount).length;
        const hasAny = ingredients.some(ing => ing && getStorageCount(ing.name) > 0);
        const stateLabel = can ? t('ui.factoryStatusAvailable') : (finishedReqs > 0 && finishedReqs < totalReqs ? t('ui.factoryStatusPartial') : (hasAny ? t('ui.factoryStatusMissing') : t('ui.factoryStatusUnmet')));
        const reqs = ingredients.map(ing => {
            if (!ing) return '';
            const have = getStorageCount(ing.name);
            const ok = have >= ing.amount;
            return `<div class="material-row ${ok ? 'has-enough' : 'not-enough'}">
                <span>${ing.icon} ${ing.name}</span>
                <span>${have} / ${ing.amount}</span>
            </div>`;
        }).join('');
        return `
            <div class="factory-product ${can ? 'factory-ready' : (hasAny ? 'factory-partial' : '')}">
                <div class="product-header">
                    <div class="product-name">${p.icon} ${p.name} <span class="crop-badge">Lv.${p.level}</span></div>
                    <div class="product-price">${formatNumber(p.sellPrice)} 💰</div>
                </div>
                <div class="product-desc">${p.description || ''}</div>
                <div class="product-requirements" style="flex-direction:column">
                    ${reqs}
                </div>
                <div class="factory-action-row">
                    <div class="factory-meta">${t('ui.factoryCost')}：${formatNumber(p.processingCost)}💰 · ${t('ui.factoryTime')}：${t('ui.factoryDays', { days: p.processingTime })}</div>
                    <div class="factory-status ${can ? 'status-ready' : (hasAny ? 'status-partial' : 'status-missing')}">${stateLabel}</div>
                </div>
                <div class="factory-button-wrap">
                    <button class="btn btn-small ${can ? 'btn-primary' : 'btn-secondary'}" data-pid="${p.id}" ${can ? '' : 'disabled'}>${can ? t('ui.startProcess') : (hasAny ? t('ui.notEnough') : t('ui.missing'))}</button>
                </div>
            </div>
        `;
    }).join('');

    box.querySelectorAll('button[data-pid]').forEach(btn => {
        btn.onclick = () => {
            const r = startProcessing(Number(btn.dataset.pid), 1);
            if (!r.ok) { showNotification(t('ui.startProcess'), r.reason, 'warning'); return; }
            showNotification(t('ui.startProcess'), t('ui.factoryWait'), 'success');
            renderFactory();
        };
    });
}

function renderFactoryProcessing() {
    const box = document.getElementById('processing-products');
    if (!box) return;
    const list = gameState.processingItems || [];
    if (list.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noProcessing') + '</div>';
        return;
    }
    box.innerHTML = list.map((item, idx) => {
        const p = getFactoryProductById(item.productId);
        if (!p) return '';
        const elapsed = gameState.day - item.startDay;
        const percent = Math.min(100, (elapsed / item.totalDays) * 100);
        return `
            <div class="factory-product">
                <div class="product-header">
                    <div class="product-name">${p.icon} ${p.name} ×${item.quantity}</div>
                    <div>${t('ui.factoryProgress', { elapsed, total: item.totalDays })}</div>
                </div>
                <div class="processing-progress">
                    <div class="processing-progress-bar" style="width:${percent}%"></div>
                </div>
                <button class="btn btn-small" data-cancel="${idx}" style="margin-top:8px">${t('ui.cancelProcess')}</button>
            </div>
        `;
    }).join('');
    box.querySelectorAll('button[data-cancel]').forEach(btn => {
        btn.onclick = () => {
            const i = Number(btn.dataset.cancel);
            const r = cancelProcessing(i);
            if (r.ok) { showNotification(t('common.remove'), t('ui.factoryRefund'), 'info'); renderFactory(); }
        };
    });
}

function renderFactoryCompleted() {
    const box = document.getElementById('completed-products');
    if (!box) return;
    const list = gameState.completedItems || [];
    if (list.length === 0) {
        box.innerHTML = '<div class="empty-state">' + t('ui.emptyState.noCompleted') + '</div>';
        return;
    }
    box.innerHTML = list.map((item, idx) => {
        const p = getFactoryProductById(item.productId);
        if (!p) return '';
        return `
            <div class="factory-product">
                <div class="product-header">
                    <div class="product-name">${p.icon} ${p.name} ×${item.quantity}</div>
                    <button class="btn btn-small" data-collect="${idx}">${t('ui.collect')}</button>
                </div>
            </div>
        `;
    }).join('') + (list.length > 1 ? `<button class="btn" id="collect-all-btn">${t('ui.collectAll')}</button>` : '');
    box.querySelectorAll('button[data-collect]').forEach(btn => {
        btn.onclick = () => {
            const r = collectProduct(Number(btn.dataset.collect));
            if (!r.ok) { showNotification(t('ui.collectFailed'), r.reason, 'warning'); return; }
            renderFactory();
            renderInventory();
        };
    });
    const all = document.getElementById('collect-all-btn');
    if (all) all.onclick = () => {
        const r = collectAllProducts();
        if (r.ok) { showNotification(t('ui.collect'), t('ui.factoryCollected', { count: r.count }), 'success'); renderFactory(); }
    };
}

function initFactoryUI() {
    const closeBtn = document.querySelector('#factory-dialog .close-btn');
    if (closeBtn) closeBtn.onclick = closeFactory;
}