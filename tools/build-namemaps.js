#!/usr/bin/env node
/* ============================================================
   tools/build-namemaps.js  —  生成跨语言存档迁移对照表
   ------------------------------------------------------------
   生成 langdata/<locale>/namemap-<locale>.js：
       globalThis.NAME_MAP_<LOCALE> = { crops:[[id,name]...], factory:[...],
                                        fertilizers:[...], mall:[...],
                                        seedSuffix, tillMachine }
   用途：切换语言时把存档里的「本地化物品名」从旧语言改成新语言。
   之所以预先生成而不是运行时 fetch 数据文件：fetch 在 file:// 下会被
   CORS 拦截，而脚本注入不受影响（本地双击 index.html、内嵌 App 都可用）。

   用法：node tools/build-namemaps.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES = ['ch', 'en'];

const DATA_FILES = [
    'currencies',
    'crops_vegetable', 'crops_fruit', 'crops_grain', 'crops_medicine', 'crops_flower',
    'crops_tropical', 'crops_mushroom', 'crops_spice', 'crops_magic', 'crops_legend',
    'index',
    'factoryproducts_1', 'factoryproducts_2', 'factoryproducts_3', 'factoryproducts_4', 'factoryproducts_5',
    'mallItems', 'skins', 'achievements', 'events', 'merchants', 'fertilizers',
];

const LV1_GROUPS = ['VEGETABLE', 'FRUIT', 'GRAIN', 'MEDICINE', 'FLOWER', 'TROPICAL', 'MUSHROOM', 'SPICE', 'MAGIC', 'LEGEND'];

function readIfExists(file) {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function buildMaps(locale) {
    const src = readIfExists(path.join(ROOT, 'langdata', 'constants.js')) + '\n'
        + DATA_FILES.map((base) => readIfExists(path.join(ROOT, 'langdata', locale, `${base}-${locale}.js`))).join('\n');

    /* 数据文件是纯声明，直接在独立函数作用域里求值即可 */
    const factory = `(function () {
        const lv1 = [];
        ${JSON.stringify(LV1_GROUPS)}.forEach((g) => {
            const arr = globalThis['FACTORY_PRODUCTS_LV1_' + g];
            if (Array.isArray(arr)) lv1.push(...arr);
        });
        const all = lv1.slice();
        [FACTORY_PRODUCTS_LV2, FACTORY_PRODUCTS_LV3, FACTORY_PRODUCTS_LV4, FACTORY_PRODUCTS_LV5_9]
            .forEach((a) => { if (Array.isArray(a)) all.push(...a); });
        return {
            crops: (typeof CROPS_ALL !== 'undefined' ? CROPS_ALL : []).map((c) => [c.id, c.name]),
            factory: all.map((p) => [p.id, p.name]),
            fertilizers: (typeof FERTILIZERS !== 'undefined' ? FERTILIZERS : []).map((f) => [f.id, f.name]),
            mall: (typeof MALL_ITEMS !== 'undefined' ? MALL_ITEMS : []).map((m) => [m.id, m.name]),
            seedSuffix: (typeof SEED_NAME_SUFFIX !== 'undefined' ? SEED_NAME_SUFFIX : ''),
            tillMachine: (typeof TILL_MACHINE_ITEM_NAME !== 'undefined' ? TILL_MACHINE_ITEM_NAME : ''),
        };
    })()`;

    return eval(src + '\n' + factory);
}

function writeNamemap(locale) {
    const maps = buildMaps(locale);
    const varName = 'NAME_MAP_' + locale.toUpperCase();
    const out = `/* ============================================================
   namemap-${locale}.js  —  ${varName}
   ------------------------------------------------------------
   跨语言存档迁移用的「id → 本地化名称」对照表（自动生成，请勿手改）。
   重新生成：node tools/build-namemaps.js
   通过 <script> 注入加载，因此 file:// 直接打开、离线、内嵌 App 都可用。
   ============================================================ */

globalThis.${varName} = ${JSON.stringify(maps)};
`;
    const file = path.join(ROOT, 'langdata', locale, `namemap-${locale}.js`);
    fs.writeFileSync(file, out);
    console.log(`✔ langdata/${locale}/namemap-${locale}.js  crops=${maps.crops.length} factory=${maps.factory.length} `
        + `fertilizers=${maps.fertilizers.length} mall=${maps.mall.length} seedSuffix="${maps.seedSuffix}"`);
    return maps;
}

let ok = true;
for (const locale of LOCALES) {
    try {
        const maps = writeNamemap(locale);
        if (maps.crops.length === 0) { console.error(`✘ ${locale}: 作物为 0，数据文件可能有问题`); ok = false; }
        if (maps.factory.length === 0) { console.error(`✘ ${locale}: 加工品为 0，数据文件可能有问题`); ok = false; }
    } catch (e) {
        console.error(`✘ ${locale}: ${e.message}`);
        ok = false;
    }
}
process.exit(ok ? 0 : 1);
