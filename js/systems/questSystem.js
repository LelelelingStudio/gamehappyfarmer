/* ============================================================
   questSystem.js  —  每日任务（框架）
   版本：v1.0.1

   注意：这一块是先占位，方便后续扩展。
   ============================================================ */

/* -------- 初始化 -------- */
function initQuests() {
    if (!gameState.dailyQuests) gameState.dailyQuests = [];
    if (!gameState.lastQuestResetDay) gameState.lastQuestResetDay = 0;
}

/* -------- 每天检查是否刷新 -------- */
function checkQuestReset() {
    if (gameState.lastQuestResetDay === gameState.day) return;
    gameState.lastQuestResetDay = gameState.day;
    generateDailyQuests();
}

/* -------- 任务描述（优先用 descKey，兼容旧存档里的纯文本） -------- */
function questText(q) {
    if (!q) return '';
    return q.descKey ? t(q.descKey) : (q.desc || '');
}

/* -------- 生成每日任务 -------- */
function generateDailyQuests() {
    initQuests();
    const quests = [];

    const pool = [
        { type: 'plant',    descKey: 'quest.plant',    target: 5,   reward: 100 },
        { type: 'harvest',  descKey: 'quest.harvest',  target: 3,   reward: 150 },
        { type: 'water',    descKey: 'quest.water',    target: 5,   reward: 100 },
        { type: 'till',     descKey: 'quest.till',     target: 2,   reward: 80  },
        { type: 'factory',  descKey: 'quest.factory',  target: 1,   reward: 200 },
        { type: 'merchant', descKey: 'quest.merchant', target: 1,   reward: 150 },
    ];

    const picked = shuffle(pool).slice(0, 3);
    for (const p of picked) {
        quests.push({
            id: uid('quest'),
            type: p.type,
            desc: t(p.descKey),          /* 存储已本地化的描述，兼容旧存档 */
            descKey: p.descKey,
            target: p.target,
            progress: 0,
            reward: p.reward,
            claimed: false,
        });
    }

    gameState.dailyQuests = quests;
    markDirty();
}

/* -------- 记录任务进度 -------- */
function recordQuestProgress(type, amount = 1) {
    if (!gameState.dailyQuests) return;
    for (const q of gameState.dailyQuests) {
        if (q.type !== type || q.progress >= q.target) continue;

        const wasIncomplete = q.progress < q.target;
        q.progress = Math.min(q.target, q.progress + amount);

        if (wasIncomplete && q.progress >= q.target && !q.claimed) {
            if (typeof showNotification === 'function') {
                showNotification(t('quest.completedTitle'), t('quest.completedBody', { desc: questText(q), reward: formatNumber(q.reward) }), 'success');
            }
            if (typeof notify !== 'undefined' && notify.questCompleted) {
                notify.questCompleted(questText(q), q.reward);
            }
        }
    }
    markDirty();
}

/* -------- 领取任务奖励 -------- */
function claimQuestReward(questId) {
    const q = gameState.dailyQuests.find(x => x.id === questId);
    if (!q) return { ok: false, reason: t('quest.errNotFound') };
    if (q.progress < q.target) return { ok: false, reason: t('quest.errNotComplete') };
    if (q.claimed) return { ok: false, reason: t('quest.errAlreadyClaimed') };

    q.claimed = true;
    addGold(q.reward);

    if (typeof playSfx === 'function') playSfx('coin');
    if (typeof showNotification === 'function') {
        showNotification(t('quest.rewardTitle'), t('quest.rewardBody', { reward: formatNumber(q.reward) }), 'success');
    }
    markDirty();
    return { ok: true, reward: q.reward };
}