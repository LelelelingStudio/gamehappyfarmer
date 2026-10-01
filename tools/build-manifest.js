#!/usr/bin/env node
/* ============================================================
   tools/build-manifest.js  —  生成资源清单 assets/manifest.js
   ------------------------------------------------------------
   扫描整个游戏文件夹，把资源按「加载顺序」写进 manifest：
     html → css → js → langdata → audio → images → other
   加了新图片 / 新音频后重新跑一次即可（node tools/build-manifest.js）。
   清单写成 .js（而不是 .json），这样 file:// 直接双击打开也能读取。
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'manifest.js');

const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'assets']);   /* assets 单独处理 */
const SKIP_FILES = new Set(['manifest.js', '.DS_Store', 'Thumbs.db', 'desktop.ini']);

function listFiles(dir, base = '') {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const rel = base ? base + '/' + entry.name : entry.name;
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            out.push(...listFiles(path.join(dir, entry.name), rel));
        } else {
            if (SKIP_FILES.has(entry.name)) continue;
            out.push(rel);
        }
    }
    return out;
}

/* ---- html / css / js / langdata ---- */
const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name);

const html = rootFiles.filter((f) => f.endsWith('.html')).sort();

const css = listFiles(path.join(ROOT, 'css')).map((f) => 'css/' + f).sort();

const js = listFiles(path.join(ROOT, 'js')).map((f) => 'js/' + f).sort();

/* langdata：按语言分开，界面语言包 + 数据文件 */
const langdata = {};
for (const loc of fs.readdirSync(path.join(ROOT, 'langdata'), { withFileTypes: true })) {
    if (!loc.isDirectory()) continue;
    langdata[loc.name] = listFiles(path.join(ROOT, 'langdata', loc.name))
        .filter((f) => f.endsWith('.js'))
        .map((f) => 'langdata/' + loc.name + '/' + f)
        .sort((a, b) => {
            /* ui / messages / documents 先，constants 单独在根目录 */
            const rank = (p) => (/ui-|messages-|documents-/.test(p) ? 0 : (/namemap-/.test(p) ? 2 : 1));
            return rank(a) - rank(b) || a.localeCompare(b);
        });
}
/* 根目录下的 constants.js 也属于 langdata 阶段 */
langdata.root = ['langdata/constants.js'];

/* ---- audio / images ---- */
function listByExt(dir, exts) {
    return listFiles(path.join(ROOT, dir))
        .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
        .map((f) => dir + '/' + f)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const audio = listByExt('assets/audio', ['.mp3', '.ogg', '.wav', '.m4a']);
const images = listByExt('assets/images', ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const icons = listByExt('assets/icons', ['.png', '.svg', '.jpg', '.webp']);

const manifest = {
    generatedAt: new Date().toISOString(),
    order: ['html', 'css', 'js', 'langdata', 'audio', 'images', 'other'],
    html,
    css,
    js,
    langdata,
    audio,
    images: images.concat(icons),
};

const content = `/* ============================================================
   manifest.js  —  资源清单（自动生成，请勿手改）
   重新生成：node tools/build-manifest.js
   ------------------------------------------------------------
   按加载顺序分组：html → css → js → langdata → audio → images
   js/core/loader.js 会按这个顺序加载并显示进度条。
   ============================================================ */

globalThis.ASSET_MANIFEST = ${JSON.stringify(manifest, null, 0)};
`;

fs.writeFileSync(OUT, content);
const size = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✔ assets/manifest.js (${size} KB)`);
console.log(`  html ${html.length} · css ${css.length} · js ${js.length} · ` +
    `langdata ${Object.values(langdata).reduce((n, a) => n + a.length, 0)} · ` +
    `audio ${audio.length} · images ${manifest.images.length}`);
