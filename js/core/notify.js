/* ============================================================
   notify.js  —  浏览器通知系统
   - iframe 环境自动禁用
   - 延迟请求权限（进入游戏 3 秒后）
   - 提供发送通知的 API
   - 用户设置里可关闭
   版本：v1.0.1
   ============================================================ */

const notify = {

    /* -------- 内部状态 -------- */
    _supported: false,           // 浏览器是否支持 Notification
    _inIframe: false,            // 是否在 iframe 中（4399 等平台）
    _askedThisSession: false,    // 本次会话是否已请求过权限

    /* ============================================================
       初始化
       ============================================================ */
    init() {
        /* 检测环境 */
        this._inIframe = isInIframe();
        this._supported = (typeof Notification !== 'undefined') && ('Notification' in window);

        console.log('[notify] 初始化：supported=' + this._supported + ', inIframe=' + this._inIframe);

        /* iframe 环境：直接标记不可用，不再请求权限 */
        if (this._inIframe) {
            console.log('[notify] 检测到 iframe 环境，浏览器通知已禁用');
            return;
        }

        if (!this._supported) {
            console.log('[notify] 浏览器不支持 Notification');
            return;
        }

        /* 同步当前权限状态到 settings（这样设置面板能正确反映实际状态） */
        try {
            const perm = Notification.permission;
            if (perm === 'granted' && gameState.settings) {
                gameState.settings.browserNotify = true;
            } else if (perm === 'denied' && gameState.settings) {
                gameState.settings.browserNotify = false;
            }
        } catch (e) { /* ignore */ }

        /* 延迟请求权限（进入游戏 3 秒后）*/
        setTimeout(() => {
            this._maybeAskPermission();
        }, NOTIFY_DELAY_MS);
    },

    /* ============================================================
       请求权限
       ============================================================ */

    /**
     * 内部：延迟后弹出询问
     */
    async _maybeAskPermission() {
        if (this._askedThisSession) return;

        /* 如果用户已经在设置里关掉了通知，不再问 */
        if (gameState.settings && gameState.settings.browserNotify === false) {
            return;
        }

        /* 已经授权 / 已拒绝过，不再问 */
        if (Notification.permission === 'granted') {
            gameState.settings.browserNotify = true;
            return;
        }
        if (Notification.permission === 'denied') {
            gameState.settings.browserNotify = false;
            return;
        }

        /* 显示自定义弹窗，问用户想不想开启 */
        this._askedThisSession = true;

        const ok = await showConfirm(
            t('notifications.browserPermissionTitle'),
            t('notifications.browserPermissionBody'),
            t('notifications.browserPermissionAllow'),
            t('notifications.browserPermissionDecline')
        );

        if (!ok) {
            gameState.settings.browserNotify = false;
            return;
        }

        /* 用户同意 → 真正请求权限 */
        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                gameState.settings.browserNotify = true;
                showNotification(t('notifications.browserPermissionEnabled'), t('notifications.browserPermissionEnabledBody'), 'success');
            } else {
                gameState.settings.browserNotify = false;
            }
        } catch (e) {
            console.warn('请求通知权限失败', e);
        }
    },

    /**
     * 手动重新请求权限（设置面板用）
     */
    async requestPermission() {
        if (!this._supported || this._inIframe) {
            console.log('[notify] requestPermission: 不可用环境');
            return false;
        }
        if (typeof Notification === 'undefined') {
            return false;
        }
        if (Notification.permission === 'granted') {
            if (gameState.settings) gameState.settings.browserNotify = true;
            return true;
        }
        if (Notification.permission === 'denied') {
            if (gameState.settings) gameState.settings.browserNotify = false;
            showAlert(
                t('notifications.browserPermissionTitle'),
                t('notifications.browserPermissionDeniedBody') || '通知权限已被浏览器拒绝，请在浏览器站点设置中开启。'
            );
            return false;
        }
        try {
            const result = await Notification.requestPermission();
            const granted = result === 'granted';
            if (gameState.settings) gameState.settings.browserNotify = granted;
            console.log('[notify] 权限请求结果:', result);
            return granted;
        } catch (e) {
            console.warn('[notify] 权限请求异常:', e);
            return false;
        }
    },

    /* ============================================================
       发送通知
       ============================================================ */

    /**
     * 发送浏览器通知
     * @param {string} title
     * @param {string} body
     * @param {string} tag  相同 tag 会合并（避免重复弹同一件事）
     */
    send(title, body = '', tag = '') {
        /* 各种检查 */
        if (!this._supported || this._inIframe) return false;
        if (!gameState.settings || !gameState.settings.browserNotify) return false;
        if (Notification.permission !== 'granted') return false;

        /* 只在页面不可见时发送，避免打扰正在玩游戏的玩家 */
        if (document.visibilityState === 'visible') {
            return false;
        }

        try {
            const n = new Notification(title, {
                body: body,
                icon: NOTIFY_ICON,
                tag: tag || undefined,
                silent: !gameState.settings.tickerSound,
            });

            /* 点击通知 → 切回游戏页面 */
            n.onclick = function () {
                window.focus();
                n.close();
            };

            /* 5 秒后自动关闭（部分浏览器支持）*/
            setTimeout(() => {
                try { n.close(); } catch (e) { /* 忽略 */ }
            }, 5000);

            return true;
        } catch (e) {
            console.warn('发送通知失败', e);
            return false;
        }
    },

    /* ============================================================
       便捷方法（供系统层调用）
       ============================================================ */

    /**
     * 任务完成通知
     */
    questCompleted(taskName, reward = 0) {
        const rewardText = reward > 0 ? t('notify.questRewardSuffix', { reward: formatNumber(reward) }) : '';
        this.send('✅ ' + t('notifications.taskCompleted'), t('notifications.taskCompletedBody', { taskName, rewardText }), 'quest');
    },

    /**
     * 加工完成通知
     */
    factoryDone(productName) {
        this.send('🏭 ' + t('notifications.factoryDone'), t('notifications.factoryDoneBody', { productName }), 'factory');
    },

    /**
     * 商人到访通知
     */
    merchantArrived(merchantName) {
        this.send('👔 ' + t('notifications.merchantArrived'), t('notifications.merchantArrivedBody', { merchantName }), 'merchant');
    },

    /**
     * 下一天冷却完毕通知
     */
    nextDayReady() {
        this.send('🌅 ' + t('notifications.nextDayReady'), t('notifications.nextDayReadyBody'), 'nextday');
    },

    /**
     * 作物生病通知
     */
    cropsSick(count) {
        this.send('🦠 ' + t('notifications.cropsSick'), t('notifications.cropsSickBody', { count }), 'sick');
    },

    /**
     * 小偷来袭通知
     */
    theft(gold) {
        this.send('🥷 ' + t('notifications.theft'), t('notifications.theftBody', { gold }), 'theft');
    },

    /**
     * 寄卖售出通知
     */
    consignmentSold(itemName, price) {
        this.send('📦 ' + t('notifications.consignmentSold'), t('notifications.consignmentSoldBody', { itemName, price }), 'consign');
    },

    /**
     * 拍卖结束通知
     */
    auctionEnded(itemName, price) {
        this.send('🔨 ' + t('notifications.auctionEnded'), t('notifications.auctionEndedBody', { itemName, price }), 'auction');
    },

    /* ============================================================
       状态查询
       ============================================================ */

    /**
     * 获取通知系统状态（设置面板用）
     */
    getState() {
        return {
            supported: this._supported,
            inIframe: this._inIframe,
            permission: this._supported ? Notification.permission : 'unsupported',
            enabled: gameState.settings ? gameState.settings.browserNotify : false,
        };
    },

    /**
     * 是否可用（设置面板用来决定要不要显示这个开关）
     */
    isAvailable() {
        return this._supported && !this._inIframe;
    },
};