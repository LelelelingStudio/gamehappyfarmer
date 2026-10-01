#!/usr/bin/env node
/* ============================================================
   tools/validate-crops.js  —  作物数据校验工具
   用法：node tools/validate-crops.js
   ------------------------------------------------------------
   数据实际位于 langdata/<locale>/crops_*-<locale>.js（不再是 js/config/crops），
   本工具会校验所有语言版本，并额外交叉检查两种语言的 id 是否一一对应。
   ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* -------- 配置 -------- */
const ROOT = path.resolve(__dirname, '..');
const LANGDATA = path.join(ROOT, 'langdata');
const LOCALES = ['ch', 'en'];

const EXPECTED_TOTAL = 1000;

const SERIES = [
    'crops_vegetable',
    'crops_fruit',
    'crops_grain',
    'crops_medicine',
    'crops_flower',
    'crops_tropical',
    'crops_mushroom',
    'crops_spice',
    'crops_magic',
    'crops_legend',
];

const EXPECTED_CATEGORY = {
    vegetable: 100, fruit: 100, grain: 100, medicine: 100, flower: 100,
    tropical: 100, mushroom: 100, spice: 100, magic: 100, legend: 100,
};

/* -------- 颜色 -------- */
const C = {
    red:    (s) => `\x1b[31m${s}\x1b[0m`,
    green:  (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
    bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

/* -------- 加载某个语言的全部作物文件 -------- */
function loadCrops(locale) {
    const context = vm.createContext({ console });
    const files = SERIES.map((base) => `${base}-${locale}.js`);

    for (const file of files) {
        const fullPath = path.join(LANGDATA, locale, file);
        if (!fs.existsSync(fullPath)) {
            console.error(C.red(`✗ 文件不存在：langdata/${locale}/${file}`));
            process.exit(1);
        }
        let code = fs.readFileSync(fullPath, 'utf-8');
        /* 顶层 const 换成 var，这样才能挂到 vm context 上 */
        code = code.replace(/^\s*const\s+(CROPS_\w+)\s*=/gm, 'var $1 =');
        try {
            vm.runInContext(code, context, { filename: file });
        } catch (e) {
            console.error(C.red(`✗ 加载失败：langdata/${locale}/${file} — ${e.message}`));
            process.exit(1);
        }
    }

    const all = [];
    for (const key of Object.keys(context)) {
        if (key.startsWith('CROPS_') && Array.isArray(context[key])) all.push(...context[key]);
    }
    return all;
}

/* -------- 校验（收集错误 / 警告）-------- */
function validate(locale, crops) {
    const errors = [];
    const warnings = [];

    if (crops.length !== EXPECTED_TOTAL) errors.push(`总数不对：期望 ${EXPECTED_TOTAL}，实际 ${crops.length}`);

    const ids = new Set();
    const names = new Set();
    const dupIds = [];
    const dupNames = [];
    let minId = Infinity, maxId = -Infinity;
    for (const c of crops) {
        if (ids.has(c.id)) dupIds.push(c.id);
        ids.add(c.id);
        if (names.has(c.name)) dupNames.push(c.name);
        names.add(c.name);
        if (c.id < minId) minId = c.id;
        if (c.id > maxId) maxId = c.id;
    }
    if (dupIds.length) errors.push(`重复 id：${dupIds.slice(0, 10).join(', ')}`);
    if (dupNames.length) errors.push(`重复名称：${dupNames.slice(0, 10).join(', ')}`);

    const required = ['id', 'name', 'icon', 'category', 'price', 'growthTime', 'sellPrice', 'unlockLevel', 'currency'];
    for (const c of crops) {
        const missing = required.filter((f) => c[f] === undefined || c[f] === null);
        if (missing.length) errors.push(`作物 id=${c.id} 缺少字段：${missing.join(', ')}`);
    }

    const actual = {};
    for (const c of crops) actual[c.category] = (actual[c.category] || 0) + 1;
    for (const cat of Object.keys(EXPECTED_CATEGORY)) {
        if (actual[cat] !== EXPECTED_CATEGORY[cat]) {
            errors.push(`分类 ${cat}：期望 ${EXPECTED_CATEGORY[cat]}，实际 ${actual[cat] || 0}`);
        }
    }

    const badRatio = crops.filter((c) => !(c.sellPrice / c.price >= 1.2 && c.sellPrice / c.price <= 6));
    if (badRatio.length) warnings.push(`${badRatio.length} 个作物售价/进价比异常（如 id=${badRatio[0].id} ${badRatio[0].name}）`);
    const badLevel = crops.filter((c) => c.unlockLevel < 1 || c.unlockLevel > 400);
    if (badLevel.length) warnings.push(`${badLevel.length} 个作物解锁等级超出 [1, 400]（如 id=${badLevel[0].id}）`);
    const badTime = crops.filter((c) => c.growthTime < 1 || c.growthTime > 100);
    if (badTime.length) warnings.push(`${badTime.length} 个作物生长时间异常（如 id=${badTime[0].id}）`);

    console.log(C.bold(C.cyan(`\n── ${locale} ─────────────────────────────`)));
    console.log(`文件 ${SERIES.length} 个 · 作物 ${crops.length} 条 · id 范围 ${minId}~${maxId}`);
    if (errors.length === 0) console.log(C.green('  ✓ 错误检查通过'));
    if (warnings.length === 0) console.log(C.green('  ✓ 警告检查通过'));
    for (const e of errors) console.log(C.red(`  · ${e}`));
    for (const w of warnings) console.log(C.yellow(`  ⚠ ${w}`));

    return { errors, warnings, ids };
}

/* -------- 主流程 -------- */
console.log(C.bold(C.cyan('\n══════════════════════════════════════════')));
console.log(C.bold(C.cyan('  🌱 作物数据校验工具  validate-crops.js')));
console.log(C.bold(C.cyan('══════════════════════════════════════════')));

let totalErrors = 0;
let totalWarnings = 0;
const idSets = {};

for (const locale of LOCALES) {
    const crops = loadCrops(locale);
    const r = validate(locale, crops);
    totalErrors += r.errors.length;
    totalWarnings += r.warnings.length;
    idSets[locale] = r.ids;
}

console.log(C.bold(C.cyan('\n── 跨语言一致性 ─────────────────────────')));
const base = LOCALES[0];
for (const locale of LOCALES.slice(1)) {
    const a = idSets[base];
    const b = idSets[locale];
    const onlyA = [...a].filter((id) => !b.has(id));
    const onlyB = [...b].filter((id) => !a.has(id));
    if (onlyA.length || onlyB.length) {
        totalErrors++;
        console.log(C.red(`  · ${base} 与 ${locale} 的 id 不一致：${base} 独有 ${onlyA.length} 个，${locale} 独有 ${onlyB.length} 个`));
    } else {
        console.log(C.green(`  ✓ ${base} 与 ${locale} 的 id 完全对应（${a.size} 个）`));
    }
}

console.log('\n──────────────────────────────────────────');
if (totalErrors === 0 && totalWarnings === 0) {
    console.log(C.bold(C.green('🎉 全部校验通过！\n')));
} else {
    console.log(C.bold(totalErrors === 0 ? C.green('✓ 无错误') : C.red(`✗ ${totalErrors} 个错误`)));
    if (totalWarnings) console.log(C.bold(C.yellow(`⚠ ${totalWarnings} 个警告`)));
    console.log('');
}
process.exit(totalErrors > 0 ? 1 : 0);
