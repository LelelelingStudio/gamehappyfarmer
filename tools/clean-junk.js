#!/usr/bin/env node
/* ============================================================
   tools/clean-junk.js  —  打包 / 内嵌进 Xcode 前清理系统垃圾文件
   ------------------------------------------------------------
   会删除所有 .DS_Store（macOS 会不断重新生成，所以打包前跑一次即可）。
   用法：node tools/clean-junk.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JUNK = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

let removed = 0;
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git') continue;
            walk(full);
        } else if (JUNK.has(entry.name)) {
            fs.unlinkSync(full);
            removed++;
            console.log('删除 ' + path.relative(ROOT, full));
        }
    }
})(ROOT);

console.log(removed === 0 ? '没有需要清理的垃圾文件 ✔' : `共清理 ${removed} 个文件 ✔`);
