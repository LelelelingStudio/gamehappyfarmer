/* ============================================================
   ui.js  —  渲染总入口
   版本：v1.0.1
   ============================================================ */

/**
 * 全量刷新所有 UI
 * 每写完一个 UI 模块就加一行 typeof 检测调用
 */
function renderGame() {
    if (typeof renderHud        === 'function') renderHud();
    if (typeof renderUserAvatar === 'function') renderUserAvatar();
    if (typeof renderFarmland   === 'function') renderFarmland();
    if (typeof renderCropsShop  === 'function') renderCropsShop();
    if (typeof renderInventory  === 'function') renderInventory();
    if (typeof renderFactory    === 'function') renderFactory();
    if (typeof renderMall       === 'function') renderMall();
    if (typeof renderSkinSelector === 'function') renderSkinSelector();
    if (typeof renderAchievements === 'function') renderAchievements();
    if (typeof renderConsignments === 'function') renderConsignments();
    if (typeof renderAuction    === 'function') renderAuction();
    if (typeof renderMerchant   === 'function') renderMerchant();
    if (typeof renderQuests     === 'function') renderQuests();
    if (typeof renderSettings   === 'function') renderSettings();
    if (typeof renderEventFrequency === 'function') renderEventFrequency();
    if (typeof updateTimerUI    === 'function') updateTimerUI();
}

/**
 * 显示 / 隐藏 loading 遮罩
 */
function hideLoadingScreen() {
    const el = document.getElementById('loading-screen');
    if (el) {
        el.classList.add('hide');
        setTimeout(() => el.remove(), 500);
    }
    document.documentElement.classList.add('js-loaded');
}