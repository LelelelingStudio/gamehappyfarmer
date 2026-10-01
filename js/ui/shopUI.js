/* ============================================================
   shopUI.js  —  种子商店
   ============================================================ */

let _shopFilter = 'all';

function getSeedCount(cropId) {
    return Number(gameState.seeds?.[cropId] || 0);
}

function addSeedCount(cropId, count = 1) {
    const next = (Number(gameState.seeds?.[cropId] || 0) + Number(count));
    gameState.seeds[cropId] = next;
    return next;
}

function consumeSeedCount(cropId, count = 1) {
    const current = Number(gameState.seeds?.[cropId] || 0);
    if (current < count) return false;
    const next = current - count;
    if (next <= 0) delete gameState.seeds[cropId];
    else gameState.seeds[cropId] = next;
    return true;
}

function renderCropsShop() {
    const container = document.getElementById('crops-list');
    if (!container) return;

    const categories = ['all', 'vegetable', 'fruit', 'grain', 'medicine', 'flower',
                        'tropical', 'mushroom', 'spice', 'magic', 'legend'];

    let list = CROPS_ALL.filter(c => c.unlockLevel <= gameState.level);
    if (_shopFilter !== 'all') list = list.filter(c => c.category === _shopFilter);

    /* 取前 30 个 */
    list = list.slice(0, 30);

    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state">' + t('ui.noCrop') + '</div>';
        return;
    }

    container.innerHTML = list.map(c => `
        <div class="crop-item" data-crop-id="${c.id}">
            <div>
                <div class="crop-name">${c.icon} ${c.name}
                    <span class="crop-badge">${getCropCategoryName(c.category)}</span>
                </div>
                <div class="crop-growth">${t('ui.growthInfo', { days: c.growthTime, sellPrice: c.sellPrice, seedCount: getSeedCount(c.id) })}</div>
            </div>
            <div class="crop-price">${c.price} 💰</div>
        </div>
    `).join('');

    container.querySelectorAll('.crop-item').forEach(el => {
        el.onclick = () => {
            const id = Number(el.dataset.cropId);
            const crop = getCropById(id);
            if (!crop) return;
            if (gameState.gold < crop.price) {
                showNotification(t('ui.goldNotEnough'), t('ui.needGold', { price: formatNumber(crop.price) }), 'warning');
                return;
            }
            /* 「种子翻倍」道具：一次购买获得多颗种子 */
            const mult = Math.max(1, Number(gameState.activeEffects.seedMultiplier) || 1);
            spendGold(crop.price);
            addSeedCount(id, mult);
            addToStorage(crop.name + (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : '种子'), mult, 1, {
                category: 'seed', icon: '🌱', sellPrice: 1,
                cropId: crop.id,
            });
            showNotification(t('ui.buySeedSuccess'), t('ui.seedCount', { name: crop.name, count: mult }), 'success');
            renderGame();
        };
    });
}

function initShopFilter() {
    document.querySelectorAll('.crop-filter .filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.crop-filter .filter-btn')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _shopFilter = btn.dataset.filter || 'all';
            renderCropsShop();
        };
    });
}