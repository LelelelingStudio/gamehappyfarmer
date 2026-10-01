/* ============================================================
   utils.js  —  通用工具函数
   不依赖任何其他文件
   版本：v1.0.1
   ============================================================ */

/* -------- 随机 -------- */

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(items) {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let roll = Math.random() * total;
    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item.type !== undefined ? item.type : item;
    }
    const last = items[items.length - 1];
    return last.type !== undefined ? last.type : last;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* -------- 数值 -------- */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatNumber(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    return Math.floor(n).toLocaleString('zh-CN');
}

function formatShort(n) {
    if (n < 1000) return String(Math.floor(n));
    if (n < 1000000) return (n / 1000).toFixed(1) + 'K';
    if (n < 1000000000) return (n / 1000000).toFixed(1) + 'M';
    return (n / 1000000000).toFixed(1) + 'B';
}

/* -------- 对象 / 数组 -------- */

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepClone);
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepClone(obj[k]);
    return out;
}

function removeFromArray(arr, item) {
    const idx = arr.indexOf(item);
    if (idx > -1) arr.splice(idx, 1);
    return arr;
}

function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
}

/* -------- 函数控制 -------- */

function debounce(fn, wait = 200) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

function throttle(fn, wait = 200) {
    let last = 0;
    return function (...args) {
        const now = Date.now();
        if (now - last >= wait) {
            last = now;
            fn.apply(this, args);
        }
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* -------- 标识 -------- */

function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* -------- 环境检测 -------- */

function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isInIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

/* -------- 数组分帧（防止阻塞主线程）-------- */

function forEachChunked(arr, chunkSize, callback, onComplete) {
    let i = 0;
    const total = arr.length;
    function step() {
        const end = Math.min(i + chunkSize, total);
        for (; i < end; i++) {
            callback(arr[i], i);
        }
        if (i < total) {
            requestAnimationFrame(step);
        } else if (onComplete) {
            onComplete();
        }
    }
    requestAnimationFrame(step);
}

/* -------- 元素辅助 -------- */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, className, innerHTML) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML !== undefined) el.innerHTML = innerHTML;
    return el;
}

/* -------- 存档辅助 -------- */

function safeJSONParse(raw, fallback = null) {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.warn('JSON 解析失败', e);
        return fallback;
    }
}

function bytesToKB(bytes) {
    return (bytes / 1024).toFixed(1);
}

function estimateJSONSize(obj) {
    try {
        const str = JSON.stringify(obj);
        return new Blob([str]).size;
    } catch (e) {
        return 0;
    }
}

/* ============================================================
   RLE 编解码（用于地块 ID 数组压缩）
   ============================================================ */

/**
 * 把有序 ID 数组编码成紧凑字符串
 * [1,2,3,5,7,9,10] → "1-3,5,7,9-10"
 */
function encodeIdsRLE(ids) {
    if (!ids || ids.length === 0) return '';
    const sorted = [...ids].sort((a, b) => a - b);
    const parts = [];
    let start = sorted[0];
    let prev  = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
        const cur = sorted[i];
        if (cur !== undefined && cur === prev + 1) {
            prev = cur;
            continue;
        }
        if (start === prev) {
            parts.push(String(start));
        } else if (prev === start + 1) {
            parts.push(String(start));
            parts.push(String(prev));
        } else {
            parts.push(`${start}${RLE_RANGE_SEP}${prev}`);
        }
        start = cur;
        prev  = cur;
    }
    return parts.join(RLE_ITEM_SEP);
}

/**
 * 把紧凑字符串解码成有序 ID 数组
 * "1-3,5,7,9-10" → [1,2,3,5,7,9,10]
 */
function decodeIdsRLE(str) {
    if (!str) return [];
    const out = [];
    for (const part of String(str).split(RLE_ITEM_SEP)) {
        if (!part) continue;
        if (part.includes(RLE_RANGE_SEP)) {
            const [a, b] = part.split(RLE_RANGE_SEP).map(Number);
            for (let i = a; i <= b; i++) out.push(i);
        } else {
            out.push(Number(part));
        }
    }
    return out;
}