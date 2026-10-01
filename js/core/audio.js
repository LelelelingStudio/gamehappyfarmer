/* ============================================================
   audio.js  —  音频系统
   音效：Web Audio API 合成（零文件）
   BGM：HTMLAudioElement 播放（5 首，75% 重复 / 25% 换歌）
   版本：v1.0.1
   ============================================================ */

const audio = {

    /* -------- 内部状态 -------- */
    _ctx: null,                  // AudioContext
    _unlocked: false,            // 用户是否已交互过
    _bgmEl: null,                // BGM 播放器
    _bgmCurrentIndex: -1,        // 当前播放的 BGM 索引
    _bgmFadeTimer: null,         // 淡入淡出定时器
    _bgmWantPlay: false,         // 是否"希望"播放 BGM（用于恢复）

    /* ============================================================
       初始化
       ============================================================ */

    /**
     * 初始化音频系统（页面加载时调用一次即可）
     */
    init() {
        /* 创建 AudioContext（可能初始为 suspended）*/
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) {
                this._ctx = new Ctx();
            }
        } catch (e) {
            console.warn('AudioContext 初始化失败', e);
        }

        /* 创建 BGM 播放器（重复 init 不重建，避免打断正在播放的音乐） */
        if (!this._bgmEl) {
            this._bgmEl = new Audio();
            this._bgmEl.preload = 'auto';
            this._bgmEl.volume = 0;
            this._bgmEl.muted = false;
            /* 注意：绝对不要设置 crossOrigin='anonymous'。
               本地用 file:// 直接打开时，带 crossOrigin 的媒体请求会被
               浏览器判为跨域失败（MEDIA_ERR_SRC_NOT_SUPPORTED），BGM 永远播不出来。
               我们也不需要读取音频数据（不做可视化/解码），保持同源请求即可。 */
            this._bgmEl.addEventListener('ended', () => this._onBgmEnded());
            this._bgmEl.addEventListener('error', () => {
                const code = this._bgmEl && this._bgmEl.error ? this._bgmEl.error.code : 0;
                console.warn('[audio] BGM 加载失败，code =', code, 'src =', this._bgmEl && this._bgmEl.src);
                this._bgmFailCount = (this._bgmFailCount || 0) + 1;
                if (typeof BGM_LIST !== 'undefined' && this._bgmFailCount < BGM_LIST.length) {
                    /* 换一首再试（线上个别文件缺失/损坏时不至于完全没声音） */
                    const next = (Math.max(0, this._bgmCurrentIndex) + 1) % BGM_LIST.length;
                    this._bgmCurrentIndex = -1;
                    if (this._unlocked) this._playBgmAt(next, { immediate: true });
                } else {
                    this._bgmCurrentIndex = -1;
                }
                this._bgmWantPlay = true;
            });
        }

        /* 武装自愈（任何交互都会尝试把音乐恢复起来） */
        this.armSelfHeal();

        /* 绑定首次用户交互，解锁音频 */
        if (!this._unlockBound) {
            this._unlockBound = true;
            const unlockOnce = () => {
                this.unlock();
                document.removeEventListener('click', unlockOnce);
                document.removeEventListener('touchstart', unlockOnce);
                document.removeEventListener('keydown', unlockOnce);
            };
            document.addEventListener('click', unlockOnce);
            document.addEventListener('touchstart', unlockOnce);
            document.addEventListener('keydown', unlockOnce);
        }
    },

    /**
     * 解锁音频（用户首次交互后调用）
     */
    unlock() {
        if (this._unlocked) return;
        this._unlocked = true;

        /* 恢复 AudioContext（必须在用户手势里调用，否则线上会被挂起） */
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume().catch(() => {});
        }

        /* 立即播 BGM：手势内同步调用 play()，避免被自动播放策略拦截 */
        if (gameState.settings && gameState.settings.bgmEnabled) {
            this.playBgm({ immediate: true });
        }
    },

    /**
     * 自动播放被浏览器拦截时：挂一次性交互监听，用户一有动作就补播
     */
    _armGestureRetry() {
        if (this._gestureRetryArmed) return;
        this._gestureRetryArmed = true;

        const retry = () => {
            this._gestureRetryArmed = false;
            document.removeEventListener('pointerdown', retry);
            document.removeEventListener('keydown', retry);
            document.removeEventListener('touchstart', retry);
            if (!this._bgmEl || !gameState.settings || !gameState.settings.bgmEnabled) return;
            if (!this._bgmEl.paused) return;
            if (!this._bgmEl.src) {
                this._bgmCurrentIndex = -1;
                this.playBgm();
                return;
            }
            this._bgmEl.play().then(() => {
                this._fadeVolume(this._bgmEl, this._bgmEl.volume, gameState.settings.bgmVolume, 500);
            }).catch(() => {
                this._bgmWantPlay = true;
                this._armGestureRetry();
            });
        };

        document.addEventListener('pointerdown', retry);
        document.addEventListener('keydown', retry);
        document.addEventListener('touchstart', retry);
    },

    /**
     * 自愈：只要「开关开着但没在响」，用户每次交互都重试一次。
     * 覆盖：自动播放被拦、切后台回来、网络中断后恢复等情况。
     */
    armSelfHeal() {
        if (this._selfHealArmed) return;
        this._selfHealArmed = true;

        const heal = () => {
            if (!gameState.settings || !gameState.settings.bgmEnabled) return;
            if (!this._bgmEl) return;
            if (!this._bgmEl.paused) return;
            this._bgmWantPlay = true;
            if (!this._bgmEl.src) {
                this._bgmCurrentIndex = -1;
                this.playBgm({ immediate: true });
                return;
            }
            this._bgmEl.play().then(() => {
                if (this._bgmEl.volume < 0.01) {
                    this._fadeVolume(this._bgmEl, this._bgmEl.volume, gameState.settings.bgmVolume || 0.3, 400);
                }
            }).catch(() => {});
        };

        document.addEventListener('pointerdown', heal);
        document.addEventListener('keydown', heal);
        document.addEventListener('touchstart', heal);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState !== 'visible') return;
            if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
            heal();
        });
    },

    /** 一键开启/关闭所有声音，并立刻给一个反馈音 */
    toggleSound() {
        const on = !(gameState.settings.bgmEnabled && gameState.settings.sfxVolume > 0);
        gameState.settings.bgmEnabled = on;
        if (on) {
            if (!(gameState.settings.bgmVolume > 0)) gameState.settings.bgmVolume = 0.3;
            if (!(gameState.settings.sfxVolume > 0)) gameState.settings.sfxVolume = 0.7;
            this._unlocked = false;
            this.unlock();
            this.playSfx('coin');
        } else {
            this.pauseBgm();
        }
        if (typeof markDirty === 'function') markDirty();
        if (typeof renderSoundToggle === 'function') renderSoundToggle();
        return on;
    },

    /** 当前声音状态（给 UI 用） */
    isSoundOn() {
        return !!(gameState.settings && gameState.settings.bgmEnabled);
    },

    /* ============================================================
       音效（Web Audio API 合成）
       ============================================================ */

    /**
     * 播放音效
     * @param {string} name 音效名（见 SFX_NAMES）
     */
    playSfx(name) {
        if (!this._ctx) {
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) this._ctx = new Ctx();
            } catch (e) {
                console.warn('AudioContext 初始失败', e);
            }
        }
        if (!this._ctx) return;

        this.unlock();
        if (!this._unlocked) return;
        if (!gameState.settings || gameState.settings.sfxVolume <= 0) return;

        const vol = gameState.settings.sfxVolume;

        try {
            switch (name) {
                case 'click':
                    this._tone(800, 'sine', 0.06, 0.4 * vol);
                    break;

                case 'coin':
                    this._tone(880, 'sine', 0.08, 0.5 * vol);
                    this._tone(1320, 'sine', 0.15, 0.45 * vol, 0.06);
                    break;

                case 'plant':
                    this._tone(300, 'triangle', 0.12, 0.5 * vol);
                    this._tone(220, 'triangle', 0.15, 0.4 * vol, 0.08);
                    break;

                case 'water':
                    this._noise(0.35, 0.3 * vol, 0, 800);
                    break;

                case 'harvest':
                    this._tone(523, 'sine', 0.1, 0.5 * vol);          // C5
                    this._tone(659, 'sine', 0.1, 0.5 * vol, 0.08);    // E5
                    this._tone(784, 'sine', 0.2, 0.5 * vol, 0.16);    // G5
                    break;

                case 'levelUp':
                    this._tone(523, 'triangle', 0.1, 0.5 * vol);       // C5
                    this._tone(659, 'triangle', 0.1, 0.5 * vol, 0.1);  // E5
                    this._tone(784, 'triangle', 0.1, 0.5 * vol, 0.2);  // G5
                    this._tone(1047, 'triangle', 0.3, 0.55 * vol, 0.3); // C6
                    break;

                case 'error':
                    this._tone(200, 'square', 0.25, 0.35 * vol);
                    this._tone(150, 'square', 0.3, 0.3 * vol, 0.1);
                    break;

                case 'notify':
                    this._tone(880, 'sine', 0.1, 0.35 * vol);
                    this._tone(1175, 'sine', 0.18, 0.35 * vol, 0.09);
                    break;

                case 'till':
                    this._noise(0.25, 0.35 * vol, 0, 500);
                    this._noise(0.2, 0.25 * vol, 0.15, 400);
                    break;

                case 'factoryDone':
                    this._tone(1318, 'sine', 0.4, 0.4 * vol);          // E6
                    this._tone(1760, 'sine', 0.5, 0.35 * vol, 0.05);   // A6
                    break;

                case 'sick':
                    this._tone(400, 'sawtooth', 0.2, 0.3 * vol);
                    this._tone(300, 'sawtooth', 0.25, 0.28 * vol, 0.15);
                    break;

                case 'achievement':
                    this._tone(659, 'triangle', 0.12, 0.5 * vol);
                    this._tone(784, 'triangle', 0.12, 0.5 * vol, 0.1);
                    this._tone(988, 'triangle', 0.12, 0.5 * vol, 0.2);
                    this._tone(1318, 'triangle', 0.35, 0.55 * vol, 0.3);
                    break;

                default:
                    /* 未知音效 → 播放默认 click */
                    this._tone(800, 'sine', 0.06, 0.3 * vol);
            }
        } catch (e) {
            /* 静默失败 */
        }
    },

    /**
     * 内部：播放一个音调
     */
    _tone(freq, type, dur, volume, delay = 0) {
        const ctx = this._ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        osc.connect(gain);
        gain.connect(ctx.destination);

        const t0 = ctx.currentTime + delay;
        const atk = 0.005;
        const rel = Math.max(dur * 0.6, 0.05);

        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(volume, t0 + atk);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur + rel);

        osc.start(t0);
        osc.stop(t0 + dur + rel + 0.05);
    },

    /**
     * 内部：播放白噪声
     */
    _noise(dur, volume, delay = 0, filterFreq = 1000) {
        const ctx = this._ctx;
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const src = ctx.createBufferSource();
        src.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = ctx.createGain();

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        const t0 = ctx.currentTime + delay;
        gain.gain.setValueAtTime(volume, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        src.start(t0);
        src.stop(t0 + dur + 0.05);
    },

    /* ============================================================
       BGM 播放器
       ============================================================ */

    /**
     * 播放 BGM（首次随机，或从暂停恢复）
     */
    playBgm(options = {}) {
        if (!this._bgmEl) return;
        if (!gameState.settings || !gameState.settings.bgmEnabled) return;
        this._bgmWantPlay = true;

        /* 如果正在播放，不重复 */
        if (!this._bgmEl.paused && this._bgmEl.currentTime > 0) return;

        /* 如果已有当前曲目，从暂停恢复 */
        if (this._bgmCurrentIndex >= 0 && this._bgmEl.src) {
            this._bgmEl.play().catch(() => {
                this._bgmWantPlay = true;
                this._armGestureRetry();
            });
            return;
        }

        /* 首次播放：随机选一首 */
        let idx;
        if (BGM_FIRST_PLAY_RANDOM) {
            idx = randInt(0, BGM_LIST.length - 1);
        } else {
            idx = 0;
        }
        this._playBgmAt(idx, options);
    },

    /**
     * 内部：播放指定索引的 BGM（含淡入）
     */
    _playBgmAt(index, options = {}) {
        if (index < 0 || index >= BGM_LIST.length) return;
        this._bgmCurrentIndex = index;
        const url = new URL(BGM_PATH_PREFIX + BGM_LIST[index], window.location.href).href;
        const targetVol = (gameState.settings && gameState.settings.bgmVolume) || 0.3;

        const startPlayback = () => {
            if (!this._bgmEl) return;
            this._bgmEl.src = url;
            this._bgmEl.loop = false;
            this._bgmEl.volume = 0;
            this._bgmEl.load();
            const p = this._bgmEl.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    this._fadeVolume(this._bgmEl, 0, targetVol, 500);
                }).catch(() => {
                    /* 被自动播放策略拦下：记录意愿，等下一次用户交互补播，并给出提示 */
                    this._bgmWantPlay = true;
                    this._armGestureRetry();
                    this._notifyAutoplayBlocked();
                });
            } else {
                this._fadeVolume(this._bgmEl, 0, targetVol, 500);
            }
        };

        if (options.immediate) {
            /* 用户手势内：直接 play()，跳过淡出等待 */
            startPlayback();
            return;
        }

        /* 换曲：先淡出再切 */
        if (this._bgmEl && !this._bgmEl.paused && this._bgmEl.currentTime > 0) {
            this._fadeVolume(this._bgmEl, this._bgmEl.volume, 0, 300, startPlayback);
        } else {
            startPlayback();
        }
    },

    /* 被自动播放策略拦下时提示一次（线上首次进入常见） */
    _notifyAutoplayBlocked() {
        if (this._autoplayHintShown) return;
        this._autoplayHintShown = true;
        if (typeof showNotification === 'function' && typeof t === 'function') {
            setTimeout(() => {
                showNotification(t('notifications.audioBlockedTitle'), t('notifications.audioBlockedBody'), 'info');
            }, 900);
        }
    },

    /**
     * 内部：BGM 播放结束时的决策
     */
    _onBgmEnded() {
        if (!gameState.settings.bgmEnabled) return;

        /* 只有一首歌时永远重播 */
        if (BGM_LIST.length <= 1) {
            this._playBgmAt(0);
            return;
        }

        /* 随机 0~1，与 0.75 比较 */
        const roll = Math.random();

        if (roll <= BGM_REPEAT_PROB) {
            /* 75%：再放一遍当前曲 */
            this._playBgmAt(this._bgmCurrentIndex);
        } else {
            /* 25%：从除当前以外的曲目里随机 */
            const candidates = [];
            for (let i = 0; i < BGM_LIST.length; i++) {
                if (i !== this._bgmCurrentIndex) candidates.push(i);
            }
            const nextIdx = candidates[randInt(0, candidates.length - 1)];
            this._playBgmAt(nextIdx);
        }
    },

    /**
     * 暂停 BGM
     */
    pauseBgm() {
        if (this._bgmEl && !this._bgmEl.paused) {
            this._bgmEl.pause();
        }
    },

    /**
     * 恢复 BGM
     */
    resumeBgm() {
        if (this._bgmEl && this._bgmEl.paused && gameState.settings.bgmEnabled) {
            this._bgmEl.play().catch(() => {
                this._bgmWantPlay = true;
                this._armGestureRetry();
            });
        }
    },

    /**
     * 停止 BGM（清空）
     */
    stopBgm() {
        if (this._bgmEl) {
            this._bgmEl.pause();
            this._bgmEl.currentTime = 0;
        }
        this._bgmCurrentIndex = -1;
    },

    /**
     * 设置 BGM 开关
     */
    setBgmEnabled(enabled) {
        gameState.settings.bgmEnabled = !!enabled;
        if (enabled) {
            this.unlock();
            this.playBgm();
        } else {
            this.pauseBgm();
        }
    },

    /**
     * 设置 BGM 音量（0-1）
     */
    setBgmVolume(v) {
        v = clamp(v, 0, 1);
        gameState.settings.bgmVolume = v;
        if (this._bgmEl) {
            /* 只在播放时应用，避免淡入被打断 */
            if (!this._bgmEl.paused) {
                this._bgmEl.volume = v;
            }
        }
    },

    /**
     * 设置音效音量（0-1）
     */
    setSfxVolume(v) {
        v = clamp(v, 0, 1);
        gameState.settings.sfxVolume = v;
    },

    /**
     * 内部：音量线性渐变
     */
    _fadeVolume(el, from, to, duration, onComplete) {
        if (this._bgmFadeTimer) {
            clearInterval(this._bgmFadeTimer);
            this._bgmFadeTimer = null;
        }

        const steps = 20;
        const stepTime = duration / steps;
        let step = 0;

        this._bgmFadeTimer = setInterval(() => {
            step++;
            const t = step / steps;
            const v = from + (to - from) * t;
            try {
                el.volume = clamp(v, 0, 1);
            } catch (e) { /* 忽略 */ }

            if (step >= steps) {
                clearInterval(this._bgmFadeTimer);
                this._bgmFadeTimer = null;
                if (onComplete) onComplete();
            }
        }, stepTime);
    },

    /* ============================================================
       状态查询
       ============================================================ */

    /**
     * 获取音频系统状态（设置面板用）
     */
    getState() {
        return {
            unlocked: this._unlocked,
            bgmEnabled: gameState.settings.bgmEnabled,
            bgmVolume: gameState.settings.bgmVolume,
            sfxVolume: gameState.settings.sfxVolume,
            bgmPlaying: this._bgmEl && !this._bgmEl.paused,
            bgmCurrentIndex: this._bgmCurrentIndex,
        };
    },
};

/* ============================================================
   便捷全局函数（供其他文件直接调用）
   ============================================================ */

function playSfx(name) {
    audio.playSfx(name);
}