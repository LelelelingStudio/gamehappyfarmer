#!/usr/bin/env node
/* ============================================================
   tools/check_i18n.js  —  全面校验 i18n 一致性
   ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = [path.join(ROOT, 'js'), path.join(ROOT, 'index.html')];
const LANG_FILES = [
    [path.join(ROOT, 'langdata', 'ch', 'ui-ch.js'), path.join(ROOT, 'langdata', 'ch', 'messages-ch.js')],
    [path.join(ROOT, 'langdata', 'en', 'ui-en.js'), path.join(ROOT, 'langdata', 'en', 'messages-en.js')],
];

function walk(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    if (fs.statSync(dir).isFile()) return [dir];
    for (const entry of fs.readdirSync(dir)) {
        const p = path.join(dir, entry);
        if (fs.statSync(p).isDirectory()) out.push(...walk(p));
        else if (p.endsWith('.js') || p.endsWith('.html')) out.push(p);
    }
    return out;
}

const files = SCAN_DIRS.flatMap(d => walk(d));

const tCalls = new Set();
const dataI18n = new Set();
const dataI18nTitle = new Set();
const dataI18nPlaceholder = new Set();
const dataI18nTip = new Set();
const dataI18nAnyKey = new Set();

for (const f of files) {
    const code = fs.readFileSync(f, 'utf8');
    const reT = /t\(\s*['"`]([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+)['"`]/g;
    let m;
    while ((m = reT.exec(code))) tCalls.add(m[1]);

    const reAttr = /data-i18n(-title|-placeholder|-tip)?\s*=\s*["']([a-zA-Z][a-zA-Z0-9_]*\.[a-zA-Z0-9_.]+)["']/g;
    while ((m = reAttr.exec(code))) {
        const type = m[1] || '';
        const key = m[2];
        if (type === '-title') dataI18nTitle.add(key);
        else if (type === '-placeholder') dataI18nPlaceholder.add(key);
        else if (type === '-tip') dataI18nTip.add(key);
        else dataI18n.add(key);
        dataI18nAnyKey.add(key);
    }
}

/* 与运行时一致：ui 包 + messages 包合并（ui 优先，messages 只补缺） */
function parseLang(files) {
    const list = Array.isArray(files) ? files : [files];
    const merged = {};
    for (const file of list) {
        const code0 = fs.readFileSync(file, 'utf8');
        const code = code0.replace(/const\s+((?:LANG|MESSAGES)_[A-Z]+)\s*=/g, 'var $1 =');
        const ctx0 = vm.createContext({});
        vm.runInContext(code, ctx0);
        const varName = Object.keys(ctx0).find((k) => k.startsWith('LANG_') || k.startsWith('MESSAGES_'));
        if (varName && ctx0[varName]) mergeMissing(merged, ctx0[varName]);
    }
    return flatten(merged);
}

function mergeMissing(base, extra) {
    for (const k of Object.keys(extra)) {
        const b = base[k]; const e = extra[k];
        if (b && typeof b === 'object' && e && typeof e === 'object') mergeMissing(b, e);
        else if (!(k in base)) base[k] = e;
    }
    return base;
}

function flatten(obj) {
    const result = new Set();
    (function walk(o, prefix) {
        if (o == null || typeof o !== 'object' || Array.isArray(o)) return;
        for (const k of Object.keys(o)) {
            const v = o[k];
            const fullKey = prefix ? prefix + '.' + k : k;
            if (typeof v === 'string') result.add(fullKey);
            else if (typeof v === 'object' && v !== null) walk(v, fullKey);
        }
    })(obj, '');
    return result;
}


const LANG_CH = parseLang(LANG_FILES[0]);
const LANG_EN = parseLang(LANG_FILES[1]);

const allKeys = new Set([...tCalls, ...dataI18nAnyKey]);

/* 形如 t('auction.bidder' + i) 的动态键：若某个已定义键以该前缀开头，则不算缺失 */
function isDynamic(key, pack) {
    for (const k of pack) { if (k.startsWith(key) && k.length > key.length) return true; }
    return false;
}
/* 语言包里重复的顶层键会被 JS 静默丢弃（曾在 ui-ch.js 里丢掉 11 个键），必须报错 */
function findDuplicateTopKeys(file) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const seen = {};
    const dups = [];
    lines.forEach((line, i) => {
        const m = /^    ([A-Za-z_$][\w$]*): \{/.exec(line);
        if (!m) return;
        if (seen[m[1]] !== undefined) dups.push(m[1] + ' (行 ' + (seen[m[1]] + 1) + ' 与 ' + (i + 1) + ')');
        else seen[m[1]] = i;
    });
    return dups;
}

const duplicateKeyReports = [];
for (const group of LANG_FILES) {
    for (const file of (Array.isArray(group) ? group : [group])) {
        const dups = findDuplicateTopKeys(file);
        if (dups.length) duplicateKeyReports.push(path.relative(ROOT, file) + ': ' + dups.join(', '));
    }
}

const allCh = [...LANG_CH];
const allEn = [...LANG_EN];
const missingCh = [...allKeys].filter(k => !LANG_CH.has(k) && !isDynamic(k, allCh)).sort();
const missingEn = [...allKeys].filter(k => !LANG_EN.has(k) && !isDynamic(k, allEn)).sort();
const dynamicCh = [...allKeys].filter(k => !LANG_CH.has(k) && isDynamic(k, allCh)).sort();

console.log('===== i18n Check =====');
console.log('Scanned files:', files.length);
console.log('  t() calls:        ', tCalls.size);
console.log('  data-i18n:        ', dataI18n.size);
console.log('  data-i18n-title:  ', dataI18nTitle.size);
console.log('  data-i18n-placeholder:', dataI18nPlaceholder.size);
console.log('  data-i18n-tip:    ', dataI18nTip.size);
console.log('LANG_CH keys:', LANG_CH.size, '   LANG_EN keys:', LANG_EN.size);
if (dynamicCh.length) console.log('动态拼接键（前缀匹配，已忽略）:', dynamicCh.join(', '));
console.log('');

if (duplicateKeyReports.length) {
    console.log('重复的顶层键（后面的定义会静默覆盖前面的！）:');
    for (const r of duplicateKeyReports) console.log('  - ' + r);
    console.log('');
}

if (missingCh.length) {
    console.log('MISSING in LANG_CH (zh):');
    for (const k of missingCh) console.log('  -', k);
    console.log('');
}
if (missingEn.length) {
    console.log('MISSING in LANG_EN (en):');
    for (const k of missingEn) console.log('  -', k);
    console.log('');
}
if (!missingCh.length && !missingEn.length) {
    console.log('All keys present in both packs. ✓');
    process.exit(0);
}
process.exit(1);