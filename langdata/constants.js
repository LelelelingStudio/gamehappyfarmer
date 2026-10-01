/* ============================================================
   constants.js  —  全局常量
   版本：v1.0.1
   ============================================================ */

/* -------- 版本 / 存档 -------- */
const GAME_VERSION = '1.0.5';   /* 音频带宽争抢修复 + 顶栏声音开关 + 声音自愈 */
const SAVE_KEY = 'farm_game_save_v1';
const SAVE_INTERVAL_MS = 30000;
const SAVE_DEBOUNCE_MS = 5000;
const SAVE_SIZE_WARN = 4.5 * 1024 * 1024;
const SAVE_SIZE_MAX  = 5.0 * 1024 * 1024;
const SAVE_COMPRESSION = true;
const SAVE_WARN_BEFORE_LEAVE = true;
const SAVE_AVATAR_KEY = 'farm_user_avatar';
const SAVE_META_KEY = 'farm_user_meta';
const SAVE_MANUAL_HINT = true;

/* -------- RLE 压缩 -------- */
const RLE_RANGE_SEP = '-';
const RLE_ITEM_SEP  = ',';

/* -------- 导入保护 -------- */
const IMPORT_WARN_OVERWRITE = true;

/* -------- 起始值 -------- */
const INITIAL_GOLD = 300;
const INITIAL_LEVEL = 1;
const INITIAL_EXP = 0;
const INITIAL_DAY = 1;
const INITIAL_OWNED_PLOTS = 6;
const INITIAL_TILLED_PLOTS = 4;
const INITIAL_STORAGE = 50;

/* -------- 等级 / 经验 -------- */
const EXP_BASE = 100;
const EXP_GROWTH = 1.5;
const LEVEL_REWARD_GOLD = 50;
const EXP_DECAY_PER_TIER = 0.01;

/* -------- 百级里程碑 -------- */
const LEVEL_MILESTONE_STEP = 100;
const LEVEL_MILESTONE_ACH_PER_STEP = 1;

/* -------- 下一天冷却 -------- */
const NEXT_DAY_COOLDOWN_SEC = 60;

/* -------- 土地 -------- */
const LAND_PRICE_BASE = 100;
const LAND_PRICE_GROWTH = 1.25;
const LAND_PRICE_LINEAR = 5;
const LAND_CLEAR_ROCK_COST = 50;
const UNTILLED_GROWTH_MULT = 0.7;
const TILLED_GROWTH_MULT = 1.0;

/* -------- 翻土小游戏 -------- */
const TILL_REQUIRED_ROUNDS = 3;
const TILL_MIN_SEC_PER_ROUND = 0.3;
const TILL_BATCH_UNLOCK_LEVEL = 6;

/* -------- 仓库 -------- */
const STORAGE_UPGRADE_COST = 200;
const STORAGE_UPGRADE_AMOUNT = 50;

/* -------- 浇水 -------- */
const WATER_ALL_COST = 20;
const WATER_BONUS_NORMAL = 0.5;
const WATER_BONUS_GOLDEN = 1.0;

/* -------- 治病 / 挖掉 -------- */
const CURE_PLANT_COST = 30;
const DIG_PLANT_REFUND_RATIO = 1 / 3;

/* -------- 商人 -------- */
const MERCHANT_PRICE_MIN = 0.8;
const MERCHANT_PRICE_MAX = 1.2;
const MERCHANT_EARLY_DAYS = 30;
const MERCHANT_VISIT_EARLY_MIN = 1;
const MERCHANT_VISIT_EARLY_MAX = 10;
const MERCHANT_VISIT_NORMAL_MIN = 1;
const MERCHANT_VISIT_NORMAL_MAX = 30;
const MERCHANT_NO_REPEAT = true;

/* -------- 寄卖 -------- */
const CONSIGNMENT_INITIAL_SLOTS = 3;
const CONSIGNMENT_SLOT_PER_LEVELS = 20;
const CONSIGNMENT_SLOT_MAX = 10;
const CONSIGNMENT_EXPIRE_DAYS = 7;
const CONSIGNMENT_FEE_BASE = 0.03;
const CONSIGNMENT_FEE_PRICE_RATIO = 0.05;
const CONSIGNMENT_PRICE_TIERS = [
    { maxRatio: 0.70, daysMin: 0, daysMax: 0, chance: 1.00 },
    { maxRatio: 0.85, daysMin: 0, daysMax: 2, chance: 1.00 },
    { maxRatio: 1.10, daysMin: 1, daysMax: 4, chance: 1.00 },
    { maxRatio: 1.50, daysMin: 2, daysMax: 7, chance: 1.00 },
    { maxRatio: 1.60, daysMin: 7, daysMax: 7, chance: 0.80 },
    { maxRatio: 1.75, daysMin: 7, daysMax: 7, chance: 0.65 },
    { maxRatio: 2.00, daysMin: 7, daysMax: 7, chance: 0.30 },
    { maxRatio: 3.00, daysMin: 7, daysMax: 7, chance: 0.01 },
];

/* -------- 拍卖会 -------- */
const AUCTION_COOLDOWN_DAYS = 14;
const AUCTION_MIN_START_RATIO = 0.80;
const AUCTION_MIN_BID_STEP = 0.05;
const AUCTION_NPC_WANT_PROB = 0.80;

/* -------- 货币系统 -------- */
const CURRENCY_UP_RATE = 110;
const CURRENCY_DOWN_RATE = 100;

/* -------- 天气 -------- */
const WEATHER_TYPES = ['晴朗', '多云', '小雨', '大雨', '暴风雨'];
const WEATHER_GROWTH_MULT = {
    '晴朗':   1.0,
    '多云':   1.0,
    '小雨':   1.2,
    '大雨':   1.4,
    '暴风雨': 0.8,
};
const WEATHER_ROLL = [
    { type: '晴朗',   weight: 50 },
    { type: '多云',   weight: 25 },
    { type: '小雨',   weight: 15 },
    { type: '大雨',   weight: 8  },
    { type: '暴风雨', weight: 2  },
];

/* -------- 季节 -------- */
const SEASONS = ['春季', '夏季', '秋季', '冬季'];
const SEASON_LENGTH_DAYS = 10;

/* -------- 随机事件 -------- */
const EVENT_BASE_PROB = 0.15;
const EVENT_MAX_PER_DAY = 2;
const EVENT_FREQUENCY_DEFAULT = 2.0;
const EVENT_QUEUE_WHEN_MODAL = true;

/* -------- 小偷 -------- */
const THEFT_BASE_PROB = 0.15;
const THEFT_MIN_GAP_DAYS = 3;
const THEFT_PERCENT = 0.10;

/* -------- 病害 -------- */
const SICKNESS_BASE_PROB = 0.06;
const SICKNESS_MAX_PLOTS = 3;

/* -------- 商城道具解锁 -------- */
const MALL_UNLOCK_FIRST = 15;
const MALL_UNLOCK_EARLY = 50;
const MALL_UNLOCK_STEP_LEVELS = 5;
const MALL_UNLOCK_STEP_COUNT = 5;
const MALL_CATEGORY_RANGES = {
    low:    [1, 15],
    normal: [16, 40],
    mid:    [41, 70],
    high:   [71, 100],
};
const MALL_PRICE_FLUCTUATION = 0.10;
const MALL_EVENT_FLUCTUATION = 0.30;

/* -------- 肥料 -------- */
const FERTILIZER_ORGANIC_MAX_STACK = 2;

/* -------- 田地显示批次 -------- */
const PLOT_DISPLAY_BATCH = 60;

/* -------- 皮肤 -------- */
const SKIN_UNLOCK_STEP = 10;
const SKIN_UNLOCK_STEP_AFTER100 = 5;

/* -------- 作物 -------- */
const CROP_SERIES_COUNT = 10;
const CROP_PER_SERIES = 100;
const CROP_TOTAL = 1000;
const CROP_VALUE_RATIO_MIN = 1.5;
const CROP_VALUE_RATIO_MAX = 3.5;

/* -------- 加工厂 -------- */
const FACTORY_LEVEL_COUNT = 9;              // 加工品共 9 级
const FACTORY_LV1_TOTAL = 1000;             // 1 级 1000 条
const FACTORY_LV2_TOTAL = 500;              // 2 级 500 条
const FACTORY_LV3_TOTAL = 250;              // 3 级 250 条
const FACTORY_LV4_TOTAL = 100;              // 4 级 100 条
const FACTORY_LV5_9_TOTAL = 43;             // 5-9 级共 43 条

/* -------- 成就 -------- */
const ACHIEVEMENT_TOTAL = 150;

/* -------- 头像 -------- */
const AVATAR_MAX_SIZE = 200;
const AVATAR_JPEG_QUALITY = 0.7;
const AVATAR_TARGET_KB = 20;
const NICKNAME_MAX_LEN = 20;   /* 昵称最长 20 字符 */

/* -------- 布局检测 -------- */
const RESIZE_DEBOUNCE_MS = 200;
const LAYOUT_DESKTOP_MIN_WIDTH = 1024;
const LAYOUT_MOBILE_MAX_WIDTH = 600;

/* -------- 存档导出 -------- */
const SAVE_FILE_EXT = '.lelelefarmer';
const SAVE_FILE_MAGIC = 'LELELEFARMER';

/* -------- 浏览器通知 -------- */
const NOTIFY_DELAY_MS = 3000;
const NOTIFY_ICON = '🌱';

/* -------- 动画时长 -------- */
const ANIM_FAST = 200;
const ANIM_BASE = 300;
const ANIM_SLOW = 500;
const NOTIFICATION_DURATION = 5000;
const TOAST_DURATION = 2000;

/* -------- 特效 -------- */
const FX_ENABLED = true;
const FX_PARTICLE_COUNT = 30;
const FX_CONFETTI_COUNT = 50;

/* ============================================================
   音频
   ============================================================ */
const BGM_VOLUME_DEFAULT     = 0.3;
const SFX_VOLUME_DEFAULT     = 0.7;
const BGM_REPEAT_PROB        = 0.75;
const BGM_FIRST_PLAY_RANDOM  = true;
const BGM_PATH_PREFIX        = 'assets/audio/bgm/';
const BGM_LIST = [
    'bgm1.mp3',
    'bgm2.mp3',
    'bgm3.mp3',
    'bgm4.mp3',
    'bgm5.mp3',
];

const SFX_NAMES = [
    'click',
    'coin',
    'plant',
    'water',
    'harvest',
    'levelUp',
    'error',
    'notify',
    'till',
    'factoryDone',
    'sick',
    'achievement',
];
/* ============================================================
   起始屏 / 会话控制
   ============================================================ */

/* 切语言需要刷新页面：刷新时置位，让刷新后直接续玩、不再弹起始选择框 */
const SKIP_START_SCREEN_KEY = 'farm_skip_start_once';

/* 用户主动「返回标题界面」时置位，下次启动强制显示起始选择框 */
const FORCE_START_SCREEN_KEY = 'farm_force_start_screen';

/* ============================================================
   头像
   ------------------------------------------------------------
   头像在存档里只存一个「短标记」，不存 base64：
     - 素材库头像：'12.png'   → assets/images/avatars/12.png
     - emoji 头像：'🐱'
     - 自定义上传：data:image/... （只有玩家自己上传图片时才会用到）
   ============================================================ */

/* 素材库目录：把 1.png ~ 30.png 放进这里即可，不需要改代码 */
const AVATAR_LIBRARY_DIR   = 'assets/images/avatars/';
const AVATAR_LIBRARY_COUNT = 180;
const AVATAR_LIBRARY_EXT   = '.png';

/* 内置 emoji 头像（10 个） */
const AVATAR_EMOJIS = ['🧑‍🌾', '👩‍🌾', '👨‍🌾', '👧', '👦', '🧓', '🐱', '🐶', '🐼', '🦊'];

