/* ============================================================
   auctionSystem.js  —  拍卖会
   版本：v1.0.1

   规则：
     - 每 14 天可发起一次
     - 起拍价 ≤ 市场价 80%
     - 每次加价 ≥ 起拍价 5%
     - NPC 根据随机事件影响购买意愿
   ============================================================ */

/* -------- 能否发起拍卖 -------- */
function canStartAuction() {
    if (gameState.auction.active && !gameState.auction.active.finished) {
        return { ok: false, reason: t('auction.errBusy') };
    }
    if (gameState.day < getNextAuctionDay()) {
        return { ok: false, reason: t('auction.errNotYet', { days: getNextAuctionDay() - gameState.day }) };
    }
    return { ok: true };
}

function getNextAuctionDay() {
    const last = gameState.auction.lastHeldDay;
    if (last < 0) return gameState.day;
    return last + AUCTION_COOLDOWN_DAYS;
}

/* -------- 发起拍卖 -------- */
function startAuction(itemName, count, startPrice) {
    if (!canStartAuction()) {
        return { ok: false, reason: t('auction.errNotYet', { days: getNextAuctionDay() - gameState.day }) };
    }
    const item = gameState.inventory[itemName];
    if (!item || item.count < count) {
        return { ok: false, reason: t('auction.errNotEnoughItems') };
    }

    const marketPrice = (item.sellPrice || 1) * count;
    const maxStart = Math.floor(marketPrice * AUCTION_MIN_START_RATIO);

    startPrice = Math.max(1, Math.floor(startPrice));
    if (startPrice > maxStart) {
        return { ok: false, reason: t('auction.errStartTooHigh', { max: formatNumber(maxStart) }) };
    }

    /* 扣物品 */
    if (!removeFromStorage(itemName, count)) {
        return { ok: false, reason: t('auction.errDeductFailed') };
    }

    /* 生成 NPC 出价池 */
    const npcs = generateAuctionBidders(item, count, marketPrice, startPrice);

    gameState.auction.active = {
        host: 'player',
        hostName: t('auction.you'),
        playerIsSeller: true,
        itemName,
        itemIcon: item.icon || '📦',
        itemCategory: item.category,
        count,
        startPrice,
        currentPrice: startPrice,
        currentBidder: null,
        marketPrice,
        minStep: Math.max(1, Math.ceil(startPrice * AUCTION_MIN_BID_STEP)),
        startDay: gameState.day,
        bidders: npcs,
        bidHistory: [],
        finished: false,
        finalWinner: null,
    };
    gameState.auction.lastHeldDay = gameState.day;

    eventBus.emit(EVENTS.AUCTION_STARTED, { itemName, startPrice });
    markDirty();
    return { ok: true };
}

/* -------- 生成 NPC 竞拍者 -------- */
function generateAuctionBidders(item, count, marketPrice, startPrice) {
    const npcs = [];
    const npcNames = [1, 2, 3, 4, 5, 6, 7].map(i => t('auction.bidder' + i));
    const npcEmojis = ['🧔', '👨‍🦰', '🧑', '👨‍💼', '👩', '🧓', '👨‍🔬'];

    const numBidders = randInt(2, 4);
    const picked = shuffle([...Array(npcNames.length).keys()]).slice(0, numBidders);

    for (const i of picked) {
        /* 每个 NPC 的预算 & 意愿 */
        const wantsItem = Math.random() < (AUCTION_NPC_WANT_PROB || 0.8);
        const budgetMult = wantsItem ? randFloat(1.0, 1.6) : randFloat(0.8, 1.1);
        npcs.push({
            id: uid('npc'),
            name: npcNames[i],
            emoji: npcEmojis[i],
            wantsItem,
            maxBudget: Math.floor(marketPrice * budgetMult),
        });
    }
    return npcs;
}

/* -------- 玩家出价 -------- */
function placePlayerBid(price) {
    const a = gameState.auction.active;
    if (!a || a.finished) return { ok: false, reason: t('auction.errNotActive') };
    /* 自己的东西不能自己抬价 */
    if (a.playerIsSeller) return { ok: false, reason: t('auction.errOwnItem') };

    price = Math.floor(price);
    if (price < a.currentPrice + a.minStep) {
        return { ok: false, reason: t('auction.errBidTooLow', { price: formatNumber(a.currentPrice + a.minStep) }) };
    }
    if (gameState.gold < price) {
        return { ok: false, reason: t('auction.errGoldNotEnough') };
    }

    a.currentPrice = price;
    a.currentBidder = 'player';
    a.bidHistory.push({ day: gameState.day, bidder: 'player', price });

    eventBus.emit(EVENTS.AUCTION_BID, { bidder: 'player', price });
    markDirty();
    return { ok: true };
}

/* -------- 推进拍卖一天（NPC 出价或结束） -------- */

/* ============================================================
   NPC 也会开拍卖：玩家可以去竞拍别人的东西
   ============================================================ */
const NPC_AUCTION_CHANCE = 0.20;      /* 每天约 20% 概率出现一场 NPC 拍卖 */

function maybeStartNpcAuction() {
    const cur = gameState.auction.active;
    if (cur && !cur.finished) return null;
    if (Math.random() > NPC_AUCTION_CHANCE) return null;

    const pool = (typeof CROPS_ALL !== 'undefined' ? CROPS_ALL : [])
        .filter((c) => c.unlockLevel <= gameState.level + 10);
    if (pool.length === 0) return null;

    const crop = pool[randInt(0, pool.length - 1)];
    const count = randInt(1, 5);
    const marketPrice = (crop.sellPrice || 10) * count;
    const startPrice = Math.max(1, Math.floor(marketPrice * 0.35));

    const npcNames = [1, 2, 3, 4, 5, 6, 7].map((i) => t('auction.bidder' + i));
    const hostName = npcNames[randInt(0, npcNames.length - 1)];

    const bidders = generateAuctionBidders({ sellPrice: crop.sellPrice || 10 }, count, marketPrice, startPrice);

    gameState.auction.active = {
        host: 'npc',
        hostName: hostName,
        playerIsSeller: false,
        itemName: crop.name,
        itemIcon: crop.icon,
        itemCategory: crop.category,
        count: count,
        startPrice: startPrice,
        currentPrice: startPrice,
        minStep: Math.max(1, Math.floor(marketPrice * 0.06)),
        bidders: bidders,
        currentBidder: bidders.length ? bidders[0].id : null,
        bidHistory: bidders.length ? [{ day: gameState.day, bidder: bidders[0].name, price: startPrice }] : [],
        startDay: gameState.day,
        finished: false,
    };

    if (typeof showNotification === 'function') {
        showNotification(t('auction.npcHostTitle'), t('auction.npcHostBody', { host: hostName, name: crop.name, count }), 'info');
    }
    if (typeof notify !== 'undefined' && notify.auctionStarted) {
        notify.auctionStarted(hostName, crop.name);
    }
    eventBus.emit(EVENTS.AUCTION_STARTED || 'auction:started', { host: hostName, item: crop.name });
    markDirty();
    return gameState.auction.active;
}

function advanceAuction() {
    const a = gameState.auction.active;
    if (!a || a.finished) {
        if (a && a.finished) clearFinishedAuction();
        maybeStartNpcAuction();
        return;
    }

    /* 玩家领先时，NPC 有机会加价 */
    if (a.currentBidder === 'player') {
        for (const npc of a.bidders) {
            if (a.currentBidder !== 'player') break;
            if (!npc.wantsItem) continue;
            const nextPrice = a.currentPrice + a.minStep * randInt(1, 3);
            if (nextPrice <= npc.maxBudget && Math.random() < 0.5) {
                a.currentPrice = nextPrice;
                a.currentBidder = npc.id;
                a.bidHistory.push({ day: gameState.day, bidder: npc.name, price: nextPrice });
                eventBus.emit(EVENTS.AUCTION_BID, { bidder: npc.name, price: nextPrice });
            }
        }
    } else {
        /* NPC 领先，NPC 之间竞价 */
        for (const npc of a.bidders) {
            if (npc.id === a.currentBidder) continue;
            if (!npc.wantsItem) continue;
            const nextPrice = a.currentPrice + a.minStep;
            if (nextPrice <= npc.maxBudget && Math.random() < 0.3) {
                a.currentPrice = nextPrice;
                a.currentBidder = npc.id;
                a.bidHistory.push({ day: gameState.day, bidder: npc.name, price: nextPrice });
            }
        }
    }

    /* 拍卖持续 3 天后结束 */
    if (gameState.day - a.startDay >= 3) {
        finalizeAuction();
    }

    markDirty();
}

/* -------- 结束拍卖 -------- */
function finalizeAuction() {
    const a = gameState.auction.active;
    if (!a || a.finished) return;

    a.finished = true;
    a.finalWinner = a.currentBidder;

    const playerWon = a.currentBidder === 'player';

    if (a.playerIsSeller) {
        /* 玩家是卖家 */
        if (playerWon) {
            /* 理论上不会发生（已经禁止自己出价），保底处理 */
            addToStorage(a.itemName, a.count, 1, { category: a.itemCategory, icon: a.itemIcon });
        } else {
            addGold(a.currentPrice);
            if (typeof showNotification === 'function') {
                showNotification(t('auction.endTitle'), t('auction.endBody', { name: a.itemName, price: formatNumber(a.currentPrice) }), 'success');
            }
            if (typeof notify !== 'undefined' && notify.auctionEnded) {
                notify.auctionEnded(a.itemName, a.currentPrice);
            }
        }
    } else if (playerWon) {
        /* 玩家在别人的拍卖会上拍到了 */
        if (gameState.gold >= a.currentPrice && spendGold(a.currentPrice)) {
            addToStorage(a.itemName, a.count, 1, { category: a.itemCategory, icon: a.itemIcon });
            gameState.stats.totalAuctionsWon++;
            if (typeof showNotification === 'function') {
                showNotification(t('auction.winTitle'), t('auction.winBody', { name: a.itemName, count: a.count, price: formatNumber(a.currentPrice) }), 'success');
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification(t('auction.endTitle'), t('auction.errGoldNotEnough'), 'warning');
            }
        }
    } else {
        /* 玩家没拍到 */
        if (typeof showNotification === 'function') {
            showNotification(t('auction.lostTitle'), t('auction.lostBody', { name: a.itemName, host: a.hostName || '' }), 'info');
        }
    }

    eventBus.emit(EVENTS.AUCTION_ENDED, a);
    markDirty();
}

/* -------- 清理已结束的拍卖 -------- */
function clearFinishedAuction() {
    if (gameState.auction.active && gameState.auction.active.finished) {
        gameState.auction.active = null;
        markDirty();
    }
}