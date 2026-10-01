/* ============================================================
   farmUI.js  —  农田渲染 + 地块点击交互
   版本：v1.0.2
   ============================================================ */

/**
 * 渲染农田网格
 * 地块数量无上限，但一次只渲染 PLOT_DISPLAY_BATCH 块（防止卡顿），
 * 超出部分用分页按钮切换（游戏宣传“无限开垦”，所以必须有翻页）。
 */
let _farmPage = 0;

function getFarmPlotPageCount() {
    return Math.max(1, Math.ceil(gameState.ownedPlots / PLOT_DISPLAY_BATCH));
}

function renderFarmPager(pageCount, from, to) {
    const farmSection = document.querySelector('.farm-section');
    if (!farmSection) return;
    let pager = document.getElementById('farm-pager');
    if (!pager) {
        pager = document.createElement('div');
        pager.id = 'farm-pager';
        pager.className = 'farm-pager';
        const anchor = document.getElementById('farmland');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(pager, anchor.nextSibling);
        else farmSection.appendChild(pager);
    }

    /* 只有一页时不需要分页器 */
    if (pageCount <= 1) {
        pager.style.display = 'none';
        pager.innerHTML = '';
        return;
    }
    pager.style.display = 'flex';
    pager.innerHTML = `
        <button class="btn btn-small" id="farm-prev-page" ${_farmPage <= 0 ? 'disabled' : ''}>◀ ${t('ui.prevPage')}</button>
        <span class="farm-page-indicator">${t('ui.pageIndicator', { page: _farmPage + 1, total: pageCount })}</span>
        <button class="btn btn-small" id="farm-next-page" ${_farmPage >= pageCount - 1 ? 'disabled' : ''}>${t('ui.nextPage')} ▶</button>
        <span class="farm-page-range">${t('ui.plotRange', { from, to })}</span>
    `;
    const prev = document.getElementById('farm-prev-page');
    if (prev) prev.onclick = () => { _farmPage = Math.max(0, _farmPage - 1); renderFarmland(); };
    const next = document.getElementById('farm-next-page');
    if (next) next.onclick = () => { _farmPage = Math.min(pageCount - 1, _farmPage + 1); renderFarmland(); };
}

function renderFarmland() {
    const container = document.getElementById('farmland');
    if (!container) return;

    /* 只渲染当前页的地块（防止无限田地卡顿） */
    const pageCount = getFarmPlotPageCount();
    if (_farmPage >= pageCount) _farmPage = pageCount - 1;
    if (_farmPage < 0) _farmPage = 0;
    const from = _farmPage * PLOT_DISPLAY_BATCH;
    const to = Math.min(gameState.ownedPlots, from + PLOT_DISPLAY_BATCH);

    /* 清空 */
    container.innerHTML = '';

    for (let i = from; i < to; i++) {
        const plot = getPlot(i);
        const el = document.createElement('div');
        el.className = 'plot ' + (plot.state || 'empty');
        el.dataset.plotId = i;

        const crop = plot.cropId && typeof getCropById === 'function'
            ? getCropById(plot.cropId)
            : null;

        let iconHtml = '';
        let infoHtml = '';

        if (plot.state === 'planted' || plot.state === 'sick') {
            if (crop) {
                iconHtml = `<div class="plot-icon">${crop.icon}</div>`;
                const done = plot.growthProgress >= crop.growthTime;
                if (done) {
                    infoHtml = `<div class="plot-info">${t('ui.plotReady')}</div>`;
                } else {
                    const percent = Math.floor((plot.growthProgress / crop.growthTime) * 100);
                    infoHtml = `<div class="plot-info">${t('ui.plotHarvestPercent', { name: crop.name, percent })}</div>`;
                }
            }
        } else if (plot.state === 'tilled') {
            iconHtml = `<div class="plot-icon">🟫</div>`;
            infoHtml = `<div class="plot-info">${t('ui.plotTilled')}</div>`;
        } else if (plot.state === 'empty') {
            iconHtml = `<div class="plot-icon">⬜</div>`;
            infoHtml = `<div class="plot-info">${t('ui.plotEmpty')}</div>`;
        } else if (plot.state === 'locked') {
            iconHtml = `<div class="plot-icon">🔒</div>`;
            infoHtml = `<div class="plot-info">${t('ui.plotUnlocked')}</div>`;
        }

        /* 状态图标 */
        const indicators = [];
        if (plot.watered) indicators.push('<div class="water-indicator">💧</div>');
        if (plot.state === 'sick') indicators.push('<div class="sick-indicator">🦠</div>');

        el.innerHTML = `
            ${indicators.join('')}
            ${iconHtml}
            ${infoHtml}
        `;

        el.onclick = () => onPlotClick(i);
        container.appendChild(el);
    }

    renderFarmPager(pageCount, from + 1, to);
    if (typeof updateTillAllButtonState === 'function') updateTillAllButtonState();

    /* 更新地块信息 */
    const ownedEl = document.getElementById('owned-plots');
    if (ownedEl) ownedEl.textContent = gameState.ownedPlots;
    const totalEl = document.getElementById('total-plots');
    if (totalEl) totalEl.textContent = gameState.ownedPlots;
}


/* -------- 一键翻土：等级 > 15 且地块 > 20 才解锁，只需玩一次小游戏 -------- */
const TILL_ALL_MIN_LEVEL = 16;      /* 等级「超过 15 级」 */
const TILL_ALL_MIN_PLOTS = 21;      /* 地块「超过 20 个」 */

function isTillAllUnlocked() {
    return gameState.level >= TILL_ALL_MIN_LEVEL && gameState.ownedPlots >= TILL_ALL_MIN_PLOTS;
}

function updateTillAllButtonState() {
    const btn = document.getElementById('till-all-btn');
    if (!btn) return;
    const unlocked = isTillAllUnlocked();
    btn.classList.toggle('locked', !unlocked);
    const icon = document.getElementById('till-all-icon');
    if (icon) icon.textContent = unlocked ? '🪓' : '🔒';
    btn.title = unlocked ? t('ui.tillAllBatch') : t('ui.tillAllLockedTip', { level: TILL_ALL_MIN_LEVEL, plots: TILL_ALL_MIN_PLOTS });
}

function startTillAll() {
    if (!isTillAllUnlocked()) {
        showAlert(
            t('ui.tillAllLockedTitle'),
            t('ui.tillAllLockedBody', { level: TILL_ALL_MIN_LEVEL, plots: TILL_ALL_MIN_PLOTS })
        );
        return;
    }

    const targets = [];
    for (let i = 0; i < gameState.ownedPlots; i++) {
        const p = getPlot(i);
        if (p.state === 'empty' && !p.tilled) targets.push(i);
    }
    if (targets.length === 0) {
        showAlert(t('ui.confirmTill'), t('ui.noEmptyPlot'));
        return;
    }

    /* 只玩一次小游戏，成功后把符合条件的空地全部翻好 */
    openTillGame(targets[0], () => {
        let count = 0;
        for (const id of targets) {
            const r = tillPlot(id);
            if (r && r.ok) count++;
        }
        renderGame();
        return { ok: count > 0, count };
    });
}

/* -------- 点击地块 -------- */
function onPlotClick(plotId) {
    const plot = getPlot(plotId);

    /* 锁定地块：提示买地 */
    if (plotId >= gameState.ownedPlots) {
        const price = getLandPrice();
        showModal(t('ui.plotUnlocked'), t('farm.unlockPrompt', { price }), [
            { text: t('ui.cancel'), value: null },
            { text: t('ui.buyAndTill'), value: 'buy', primary: true },
        ]).then(v => {
            if (v !== 'buy') return;
            const r = buyLand();
            if (!r.ok) {
                showAlert(t('ui.purchaseFailed'), r.reason);
                return;
            }
            showNotification(t('ui.buyLandSuccess'), t('ui.buyLandCost', { price: r.price }), 'success');
            addLog(t('ui.buyLandLog', { price: r.price }), 'success');
            renderGame();
        });
        return;
    }

    if (plot.state === 'empty') {
        openTillMenu(plotId);
    } else if (plot.state === 'tilled') {
        openPlantingMenu(plotId);
    } else if (plot.state === 'planted') {
        openPlantMenu(plotId);
    } else if (plot.state === 'sick') {
        openSickMenu(plotId);
    }
}

/* -------- 空地：翻土 -------- */
function openTillMenu(plotId) {
    showModal(t('ui.openLandTitle'), t('ui.openLandPrompt'), [
        { text: t('ui.cancel'), value: null },
        { text: t('ui.confirmTill'), value: 'till', primary: true },
    ]).then(v => {
        if (v !== 'till') return;
        openTillGame(plotId);
    });
}

/* -------- 翻土小游戏 -------- */
let _tillGameState = null;

function openTillGame(plotId, onComplete) {
    const dialog = document.getElementById('till-game-dialog');
    /* onComplete：小游戏成功后要做的事（一键翻土时是批量翻土） */
    const finish = () => {
        if (typeof onComplete === 'function') return onComplete();
        return tillPlot(plotId);
    };
    if (!dialog) {
        const r = finish();
        if (!r.ok) { showAlert(t('farm.tillFailed'), r.reason); return; }
        renderGame();
        return;
    }

    dialog.classList.add('show');
    _tillGameState = {
        plotId,
        rounds: 0,
        lastAngle: null,
        progressAngle: 0,
        lastRoundAt: Date.now(),
        lastPointerAngle: 0,
        pointerActive: false,
        finished: false,
    };

    const canvas = document.getElementById('till-canvas');
    const progressText = document.getElementById('till-progress-text');
    const fill = document.getElementById('till-progress-fill');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const center = canvas.width / 2;
    const radius = 110;

    function drawTrack() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#dfe8d8';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.min(1, _tillGameState.rounds / TILL_REQUIRED_ROUNDS)));
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#7bbf68';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(center, center);
        const angle = _tillGameState.lastPointerAngle || -Math.PI / 2;
        const x = center + Math.cos(angle) * (radius + 16);
        const y = center + Math.sin(angle) * (radius + 16);
        ctx.lineTo(x, y);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#5d7c52';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(center, center, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#f8f5d6';
        ctx.fill();
        ctx.strokeStyle = '#5d7c52';
        ctx.stroke();
    }

    function updateUI() {
        if (!progressText || !fill) return;
        const ratio = Math.min(1, _tillGameState.rounds / TILL_REQUIRED_ROUNDS);
        progressText.textContent = `${_tillGameState.rounds} / ${TILL_REQUIRED_ROUNDS}`;
        fill.style.width = `${ratio * 100}%`;
        drawTrack();
    }

    function finishTill() {
        if (_tillGameState.finished) return;
        _tillGameState.finished = true;
        const r = finish();
        if (!r.ok) {
            showAlert(t('ui.confirmTill'), r.reason);
            dialog.classList.remove('show');
            renderGame();
            return;
        }
        const msg = (typeof r.count === 'number') ? t('ui.tillAllCount', { count: r.count }) : t('ui.tillReady');
        showNotification(t('ui.tillSuccess'), msg, 'success');
        dialog.classList.remove('show');
        renderGame();
    }

    function onMove(event) {
        if (!_tillGameState || _tillGameState.finished) return;
        const rect = canvas.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        const dx = px - center;
        const dy = py - center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 24 || dist > radius + 28) return;

        const angle = Math.atan2(dy, dx);
        if (_tillGameState.lastAngle === null) {
            _tillGameState.lastAngle = angle;
            _tillGameState.lastPointerAngle = angle;
            return;
        }

        let delta = angle - _tillGameState.lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        if (Math.abs(delta) < 0.08) {
            _tillGameState.lastPointerAngle = angle;
            updateUI();
            return;
        }

        _tillGameState.lastAngle = angle;
        _tillGameState.lastPointerAngle = angle;
        _tillGameState.progressAngle += Math.abs(delta);

        const minMs = TILL_MIN_SEC_PER_ROUND * 1000;
        const now = Date.now();
        if (_tillGameState.progressAngle >= Math.PI * 2) {
            if (now - _tillGameState.lastRoundAt >= minMs) {
                _tillGameState.rounds += 1;
                _tillGameState.lastRoundAt = now;
                _tillGameState.progressAngle -= Math.PI * 2;
                if (_tillGameState.rounds >= TILL_REQUIRED_ROUNDS) {
                    finishTill();
                }
            } else {
                _tillGameState.progressAngle = 0;
            }
        }

        updateUI();
    }

    function onPointerDown(event) {
        _tillGameState.pointerActive = true;
        canvas.setPointerCapture?.(event.pointerId);
        onMove(event);
    }

    function onPointerUp() {
        _tillGameState.pointerActive = false;
        _tillGameState.lastAngle = null;
    }

    canvas.onpointerdown = onPointerDown;
    canvas.onpointermove = onMove;
    canvas.onpointerup = onPointerUp;
    canvas.onpointerleave = onPointerUp;
    canvas.onpointercancel = onPointerUp;
    _tillGameState.lastRoundAt = Date.now();
    updateUI();
}

/* -------- 已翻土：种植菜单 -------- */
function openPlantingMenu(plotId) {
    /* 按玩家等级筛选可种植的作物（限定前 50 种，避免太长） */
    const crops = CROPS_ALL
        .filter(c => c.unlockLevel <= gameState.level)
        .slice(0, 50);

    if (crops.length === 0) {
        showAlert(t('farm.plantUnavailableTitle'), t('farm.plantUnavailableBody'));
        return;
    }

    const buttons = crops.slice(0, 10).map(c => ({
        text: `${c.icon} ${c.name}(${c.price}💰)`,
        value: c.id,
    }));
    /* 二手种子（更便宜但长得慢、易生病） */
    const shNames = Object.keys(gameState.inventory || {})
        .filter((n) => n.indexOf('（二手）') >= 0 && gameState.inventory[n].cropId && gameState.inventory[n].count > 0);
    for (const n of shNames.slice(0, 6)) {
        buttons.push({ text: '♻️ ' + n + ' ×' + gameState.inventory[n].count, value: 'sh:' + gameState.inventory[n].cropId });
    }

    buttons.push({ text: t('common.cancel'), value: null });

    showModal(
        t('farm.chooseCrop'),
        t('farm.cropStatus', { level: gameState.level, gold: gameState.gold }),
        buttons
    ).then(v => {
        if (v === null || v === undefined) return;
        const secondHand = (typeof v === 'string' && v.indexOf('sh:') === 0);
        const cropId = secondHand ? Number(String(v).slice(3)) : v;
        const r = plantCrop(plotId, cropId, { secondHand });
        if (!r.ok) { showAlert(t('farm.plantFailed'), r.reason); return; }
        renderGame();
    });
}

/* -------- 已种植：浇水 / 施肥 / 收获 / 挖掉 -------- */
function openPlantMenu(plotId) {
    const plot = getPlot(plotId);
    const crop = typeof getCropById === 'function' ? getCropById(plot.cropId) : null;
    if (!crop) return;

    const done = plot.growthProgress >= crop.growthTime;
    const percent = Math.floor((plot.growthProgress / crop.growthTime) * 100);

    const buttons = [];
    if (done) {
        buttons.push({ text: t('ui.harvestAction'), value: 'harvest', primary: true });
    } else if (!plot.watered) {
        buttons.push({ text: t('ui.waterAction'), value: 'water', primary: true });
    }
    buttons.push({ text: t('ui.fertilizerAction'), value: 'fertilize' });
    buttons.push({ text: t('ui.digAction'), value: 'dig', danger: true });
    buttons.push({ text: t('ui.cancelAction'), value: null });

    showModal(
        `${crop.icon} ${crop.name}`,
        t('ui.growthProgress', { percent, watered: plot.watered ? t('ui.watered') : t('ui.unwatered') }),
        buttons
    ).then(v => {
        if (v === null || v === undefined) return;

        if (v === 'harvest') {
            const r = harvestCrop(plotId);
            if (!r.ok) { showAlert(t('farm.harvestFailed'), r.reason); return; }
            showNotification(t('farm.harvestSuccess'), r.crop.name, 'success');
        } else if (v === 'water') {
            const r = waterPlot(plotId);
            if (!r.ok) { showAlert(t('farm.waterFailed'), r.reason); return; }
        } else if (v === 'fertilize') {
            openFertilizeMenu(plotId);
            return;
        } else if (v === 'dig') {
            const r = digPlant(plotId);
            if (!r.ok) { showAlert(t('farm.digFailed'), r.reason); return; }
        }
        renderGame();
    });
}

/* -------- 生病：治疗 / 挖掉 -------- */
function openSickMenu(plotId) {
    showModal(t('farm.sickTitle'), t('farm.sickPrompt', { cost: CURE_PLANT_COST }), [
        { text: t('common.cancel'), value: null },
        { text: '🩺 ' + t('farm.cure'), value: 'cure', primary: true },
        { text: '🪓 ' + t('farm.dig'), value: 'dig', danger: true },
    ]).then(v => {
        if (v === null || v === undefined) return;
        if (v === 'cure') {
            const r = curePlant(plotId);
            if (!r.ok) { showAlert(t('farm.cureFailed'), r.reason); return; }
        } else if (v === 'dig') {
            const r = digPlant(plotId);
            if (!r.ok) { showAlert(t('farm.digFailed'), r.reason); return; }
        }
        renderGame();
    });
}

/* -------- 施肥菜单 -------- */
function openFertilizeMenu(plotId) {
    if (typeof FERTILIZERS === 'undefined') {
        showAlert(t('farm.fertilizerUnavailableTitle'), t('farm.fertilizerUnavailableBody'));
        return;
    }
    const available = FERTILIZERS.filter(f => gameState.level >= f.unlockLevel);
    if (available.length === 0) {
        showAlert(t('farm.noFertilizerTitle'), t('farm.noFertilizerBody'));
        return;
    }
    const buttons = available.map(f => ({
        text: `${f.icon} ${f.name}${t('farm.fertilizerStock', { count: getStorageCount(f.name) })}`,
        value: f.id,
    }));
    buttons.push({ text: t('common.cancel'), value: null });

    showModal(t('farm.chooseFertilizer'), '', buttons).then(v => {
        if (v === null || v === undefined) return;
        const f = getFertilizerById(v);
        if (!f) return;
        const r = fertilizePlot(plotId, f);
        if (!r.ok) { showAlert(t('farm.fertilizeFailed'), r.reason); return; }
        showNotification(t('farm.fertilizeSuccess'), f.name, 'success');
        renderGame();
    });
}