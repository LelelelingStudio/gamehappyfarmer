/* ============================================================
   achievements.js  —  150 个成就
   版本：v1.0.1

   分类：
     farm      种植/浇水/翻土类
     harvest   收获类
     economy   经济/交易类
     level     等级/经验类
     collect   收集/图鉴类
     day       天数/时间类
     special   特殊事件类
     hidden    隐藏成就（不显示条件）

   条件类型（condition）：
     plantCount / waterCount / tillCount
     harvestCount / cropHarvest{name}
     goldEarned / goldSpent / goldHeld
     levelReached / expTotal
     cropCollect / categoryCollect
     factoryRun / productCollect
     itemSold / merchantTrade / merchantTradeWith{id}
     consignmentSold / auctionWin
     skinUsed / landOwned
     dayReached / seasonSeen / weatherSeen
     special:xxx（自定义检查）
   ============================================================ */

const ACHIEVEMENTS = [

    /* ========== 一、种植类 1-20 ========== */
    { id:1,   name:'初次耕作',       icon:'🌱',  category:'farm',    hidden:false, description:'种下第一颗种子',              condition:'plantCount',    conditionParam:1      },
    { id:2,   name:'小试牛刀',       icon:'🌿',  category:'farm',    hidden:false, description:'种下 10 颗种子',              condition:'plantCount',    conditionParam:10     },
    { id:3,   name:'勤劳的双手',     icon:'👨‍🌾', category:'farm',    hidden:false, description:'种下 100 颗种子',             condition:'plantCount',    conditionParam:100    },
    { id:4,   name:'熟能生巧',       icon:'🧑‍🌾', category:'farm',    hidden:false, description:'种下 500 颗种子',             condition:'plantCount',    conditionParam:500    },
    { id:5,   name:'千锤百炼',       icon:'💪',  category:'farm',    hidden:false, description:'种下 1,000 颗种子',           condition:'plantCount',    conditionParam:1000   },
    { id:6,   name:'种植大师',       icon:'🏅',  category:'farm',    hidden:false, description:'种下 5,000 颗种子',           condition:'plantCount',    conditionParam:5000   },
    { id:7,   name:'种子收藏家',     icon:'🎖️',  category:'farm',    hidden:false, description:'种下 10,000 颗种子',          condition:'plantCount',    conditionParam:10000  },
    { id:8,   name:'万顷良田',       icon:'🌾',  category:'farm',    hidden:false, description:'种下 50,000 颗种子',          condition:'plantCount',    conditionParam:50000  },
    { id:9,   name:'永不停歇',       icon:'♾️',  category:'farm',    hidden:true,  description:'种下 100,000 颗种子',         condition:'plantCount',    conditionParam:100000 },
    { id:10,  name:'浇水学徒',       icon:'💧',  category:'farm',    hidden:false, description:'浇水 10 次',                  condition:'waterCount',    conditionParam:10     },
    { id:11,  name:'灌溉专家',       icon:'🚿',  category:'farm',    hidden:false, description:'浇水 100 次',                 condition:'waterCount',    conditionParam:100    },
    { id:12,  name:'水之主人',       icon:'🌊',  category:'farm',    hidden:false, description:'浇水 1,000 次',               condition:'waterCount',    conditionParam:1000   },
    { id:13,  name:'翻土新手',       icon:'🪓',  category:'farm',    hidden:false, description:'翻土 1 次',                   condition:'tillCount',     conditionParam:1      },
    { id:14,  name:'翻土达人',       icon:'⛏️',  category:'farm',    hidden:false, description:'翻土 100 次',                 condition:'tillCount',     conditionParam:100    },
    { id:15,  name:'翻土大师',       icon:'🔨',  category:'farm',    hidden:false, description:'翻土 1,000 次',               condition:'tillCount',     conditionParam:1000   },
    { id:16,  name:'热爱土地',       icon:'🌍',  category:'farm',    hidden:false, description:'翻土 10,000 次',              condition:'tillCount',     conditionParam:10000  },
    { id:17,  name:'温室园丁',       icon:'🏠',  category:'farm',    hidden:false, description:'使用温室累计 30 天',          condition:'special:greenhouse30',  conditionParam:30 },
    { id:18,  name:'完美浇灌',       icon:'✨',  category:'farm',    hidden:true,  description:'单日给 100 块地浇水',         condition:'special:water100in1day', conditionParam:100 },
    { id:19,  name:'施肥专家',       icon:'🧪',  category:'farm',    hidden:false, description:'使用肥料 100 次',             condition:'special:fertilizer100', conditionParam:100 },
    { id:20,  name:'绿手指',         icon:'🌱',  category:'farm',    hidden:true,  description:'连续 7 天每天种植 10 次以上', condition:'special:plantStreak7',  conditionParam:7  },

    /* ========== 二、收获类 21-40 ========== */
    { id:21,  name:'第一次收获',     icon:'🧺',  category:'harvest', hidden:false, description:'收获 1 次',                   condition:'harvestCount', conditionParam:1      },
    { id:22,  name:'收获的喜悦',     icon:'🍎',  category:'harvest', hidden:false, description:'收获 10 次',                  condition:'harvestCount', conditionParam:10     },
    { id:23,  name:'小有收成',       icon:'🌾',  category:'harvest', hidden:false, description:'收获 100 次',                 condition:'harvestCount', conditionParam:100    },
    { id:24,  name:'丰收之年',       icon:'🎉',  category:'harvest', hidden:false, description:'收获 1,000 次',               condition:'harvestCount', conditionParam:1000   },
    { id:25,  name:'大丰收',         icon:'🏆',  category:'harvest', hidden:false, description:'收获 5,000 次',               condition:'harvestCount', conditionParam:5000   },
    { id:26,  name:'收获大师',       icon:'👑',  category:'harvest', hidden:false, description:'收获 10,000 次',              condition:'harvestCount', conditionParam:10000  },
    { id:27,  name:'万颗归仓',       icon:'📦',  category:'harvest', hidden:false, description:'收获 50,000 次',              condition:'harvestCount', conditionParam:50000  },
    { id:28,  name:'粮仓满溢',       icon:'🏬',  category:'harvest', hidden:true,  description:'收获 100,000 次',             condition:'harvestCount', conditionParam:100000 },
    { id:29,  name:'稻谷飘香',       icon:'🍚',  category:'harvest', hidden:false, description:'累计收获 100 个水稻',         condition:'cropHarvest',  conditionParam:{ name:'水稻', count:100 } },
    { id:30,  name:'小麦帝国',       icon:'🌾',  category:'harvest', hidden:false, description:'累计收获 1,000 个小麦',       condition:'cropHarvest',  conditionParam:{ name:'小麦', count:1000 } },
    { id:31,  name:'南瓜之王',       icon:'🎃',  category:'harvest', hidden:false, description:'累计收获 500 个南瓜',         condition:'cropHarvest',  conditionParam:{ name:'南瓜', count:500 } },
    { id:32,  name:'西瓜大亨',       icon:'🍉',  category:'harvest', hidden:false, description:'累计收获 500 个西瓜',         condition:'cropHarvest',  conditionParam:{ name:'西瓜', count:500 } },
    { id:33,  name:'草莓控',         icon:'🍓',  category:'harvest', hidden:false, description:'累计收获 1,000 个草莓',       condition:'cropHarvest',  conditionParam:{ name:'草莓', count:1000 } },
    { id:34,  name:'蓝莓爱好者',     icon:'🫐',  category:'harvest', hidden:false, description:'累计收获 500 个蓝莓',         condition:'cropHarvest',  conditionParam:{ name:'蓝莓', count:500 } },
    { id:35,  name:'蘑菇猎人',       icon:'🍄',  category:'harvest', hidden:false, description:'累计收获 500 个菌类',         condition:'categoryHarvest', conditionParam:{ category:'mushroom', count:500 } },
    { id:36,  name:'香料大师',       icon:'🌶️',  category:'harvest', hidden:false, description:'累计收获 500 个香料',         condition:'categoryHarvest', conditionParam:{ category:'spice', count:500 } },
    { id:37,  name:'药材猎人',       icon:'💊',  category:'harvest', hidden:false, description:'累计收获 500 个药材',         condition:'categoryHarvest', conditionParam:{ category:'medicine', count:500 } },
    { id:38,  name:'花卉园丁',       icon:'🌸',  category:'harvest', hidden:false, description:'累计收获 500 个花卉',         condition:'categoryHarvest', conditionParam:{ category:'flower', count:500 } },
    { id:39,  name:'热带风暴',       icon:'🥥',  category:'harvest', hidden:false, description:'累计收获 500 个热带作物',     condition:'categoryHarvest', conditionParam:{ category:'tropical', count:500 } },
    { id:40,  name:'传说的见证者',   icon:'🐉',  category:'harvest', hidden:true,  description:'收获 1 个传说作物',           condition:'categoryHarvest', conditionParam:{ category:'legend', count:1 } },

    /* ========== 三、经济类 41-65 ========== */
    { id:41,  name:'第一桶金',       icon:'💰',  category:'economy', hidden:false, description:'累计赚取 100 金币',           condition:'goldEarned',  conditionParam:100         },
    { id:42,  name:'小富即安',       icon:'💵',  category:'economy', hidden:false, description:'累计赚取 1,000 金币',         condition:'goldEarned',  conditionParam:1000        },
    { id:43,  name:'腰缠万贯',       icon:'💴',  category:'economy', hidden:false, description:'累计赚取 10,000 金币',        condition:'goldEarned',  conditionParam:10000       },
    { id:44,  name:'富甲一方',       icon:'🏦',  category:'economy', hidden:false, description:'累计赚取 100,000 金币',       condition:'goldEarned',  conditionParam:100000      },
    { id:45,  name:'百万富翁',       icon:'💎',  category:'economy', hidden:false, description:'累计赚取 1,000,000 金币',     condition:'goldEarned',  conditionParam:1000000     },
    { id:46,  name:'千万富豪',       icon:'💠',  category:'economy', hidden:false, description:'累计赚取 10,000,000 金币',    condition:'goldEarned',  conditionParam:10000000    },
    { id:47,  name:'亿万富翁',       icon:'👑',  category:'economy', hidden:true,  description:'累计赚取 100,000,000 金币',   condition:'goldEarned',  conditionParam:100000000   },
    { id:48,  name:'挥金如土',       icon:'💸',  category:'economy', hidden:false, description:'累计花费 10,000 金币',        condition:'goldSpent',   conditionParam:10000       },
    { id:49,  name:'消费主义者',     icon:'🛍️',  category:'economy', hidden:false, description:'累计花费 100,000 金币',       condition:'goldSpent',   conditionParam:100000      },
    { id:50,  name:'一掷千金',       icon:'🎰',  category:'economy', hidden:true,  description:'累计花费 1,000,000 金币',     condition:'goldSpent',   conditionParam:1000000     },
    { id:51,  name:'首次出售',       icon:'🤝',  category:'economy', hidden:false, description:'出售 1 件物品',               condition:'itemSold',    conditionParam:1           },
    { id:52,  name:'商人朋友',       icon:'🎩',  category:'economy', hidden:false, description:'出售 100 件物品',             condition:'itemSold',    conditionParam:100         },
    { id:53,  name:'商业伙伴',       icon:'💼',  category:'economy', hidden:false, description:'出售 1,000 件物品',           condition:'itemSold',    conditionParam:1000        },
    { id:54,  name:'交易大师',       icon:'🏪',  category:'economy', hidden:false, description:'出售 10,000 件物品',          condition:'itemSold',    conditionParam:10000       },
    { id:55,  name:'第一次寄卖',     icon:'📮',  category:'economy', hidden:false, description:'首次寄卖物品',                condition:'consignmentSold', conditionParam:1      },
    { id:56,  name:'寄卖老手',       icon:'📦',  category:'economy', hidden:false, description:'成功寄卖 10 次',              condition:'consignmentSold', conditionParam:10     },
    { id:57,  name:'寄卖大师',       icon:'📬',  category:'economy', hidden:false, description:'成功寄卖 100 次',             condition:'consignmentSold', conditionParam:100    },
    { id:58,  name:'拍卖新人',       icon:'🔨',  category:'economy', hidden:false, description:'首次赢得拍卖',                condition:'auctionWin',  conditionParam:1           },
    { id:59,  name:'拍卖老手',       icon:'🔔',  category:'economy', hidden:false, description:'赢得 10 次拍卖',              condition:'auctionWin',  conditionParam:10          },
    { id:60,  name:'拍卖大师',       icon:'🏆',  category:'economy', hidden:false, description:'赢得 100 次拍卖',             condition:'auctionWin',  conditionParam:100         },
    { id:61,  name:'首次加工',       icon:'🏭',  category:'economy', hidden:false, description:'加工 1 次',                   condition:'factoryRun',  conditionParam:1           },
    { id:62,  name:'加工达人',       icon:'⚙️',  category:'economy', hidden:false, description:'加工 100 次',                 condition:'factoryRun',  conditionParam:100         },
    { id:63,  name:'加工大师',       icon:'🔧',  category:'economy', hidden:false, description:'加工 1,000 次',               condition:'factoryRun',  conditionParam:1000        },
    { id:64,  name:'加工之神',       icon:'⚗️',  category:'economy', hidden:true,  description:'加工 10,000 次',              condition:'factoryRun',  conditionParam:10000       },
    { id:65,  name:'持家有道',       icon:'🧮',  category:'economy', hidden:true,  description:'单次赚取 10,000 金币',        condition:'special:earnBig', conditionParam:10000  },

    /* ========== 四、等级/经验类 66-80 ========== */
    { id:66,  name:'初出茅庐',       icon:'⭐',  category:'level',   hidden:false, description:'达到 5 级',                    condition:'levelReached', conditionParam:5       },
    { id:67,  name:'崭露头角',       icon:'🌟',  category:'level',   hidden:false, description:'达到 10 级',                   condition:'levelReached', conditionParam:10      },
    { id:68,  name:'小有名气',       icon:'✨',  category:'level',   hidden:false, description:'达到 25 级',                   condition:'levelReached', conditionParam:25      },
    { id:69,  name:'声名鹊起',       icon:'💫',  category:'level',   hidden:false, description:'达到 50 级',                   condition:'levelReached', conditionParam:50      },
    { id:70,  name:'名扬四海',       icon:'🎇',  category:'level',   hidden:false, description:'达到 75 级',                   condition:'levelReached', conditionParam:75      },
    { id:71,  name:'万众瞩目',       icon:'🌈',  category:'level',   hidden:false, description:'达到 100 级',                  condition:'levelReached', conditionParam:100     },
    { id:72,  name:'传奇农夫',       icon:'🏅',  category:'level',   hidden:false, description:'达到 150 级',                  condition:'levelReached', conditionParam:150     },
    { id:73,  name:'神话农夫',       icon:'👑',  category:'level',   hidden:false, description:'达到 200 级',                  condition:'levelReached', conditionParam:200     },
    { id:74,  name:'超凡入圣',       icon:'🌌',  category:'level',   hidden:true,  description:'达到 250 级',                  condition:'levelReached', conditionParam:250     },
    { id:75,  name:'永生者',         icon:'♾️',  category:'level',   hidden:true,  description:'达到 300 级',                  condition:'levelReached', conditionParam:300     },
    { id:76,  name:'经验收集者',     icon:'📘',  category:'level',   hidden:false, description:'累计获得 10,000 经验',         condition:'expTotal',     conditionParam:10000   },
    { id:77,  name:'经验大师',       icon:'📚',  category:'level',   hidden:false, description:'累计获得 100,000 经验',        condition:'expTotal',     conditionParam:100000  },
    { id:78,  name:'经验之神',       icon:'🧠',  category:'level',   hidden:true,  description:'累计获得 1,000,000 经验',      condition:'expTotal',     conditionParam:1000000 },
    { id:79,  name:'首次扩地',       icon:'🗺️',  category:'level',   hidden:false, description:'拥有 10 块地',                 condition:'landOwned',    conditionParam:10      },
    { id:80,  name:'土地大亨',       icon:'🏞️',  category:'level',   hidden:false, description:'拥有 50 块地',                 condition:'landOwned',    conditionParam:50      },

    /* ========== 五、收集类 81-105 ========== */
    { id:81,  name:'蔬菜入门',       icon:'🥬',  category:'collect', hidden:false, description:'收集 10 种蔬菜',               condition:'categoryCollect', conditionParam:{ category:'vegetable', count:10  } },
    { id:82,  name:'蔬菜专家',       icon:'🥦',  category:'collect', hidden:false, description:'收集 50 种蔬菜',               condition:'categoryCollect', conditionParam:{ category:'vegetable', count:50  } },
    { id:83,  name:'蔬菜大师',       icon:'🥕',  category:'collect', hidden:true,  description:'收集全部 100 种蔬菜',         condition:'categoryCollect', conditionParam:{ category:'vegetable', count:100 } },
    { id:84,  name:'水果爱好者',     icon:'🍎',  category:'collect', hidden:false, description:'收集 10 种水果',               condition:'categoryCollect', conditionParam:{ category:'fruit',     count:10  } },
    { id:85,  name:'水果达人',       icon:'🍇',  category:'collect', hidden:false, description:'收集 50 种水果',               condition:'categoryCollect', conditionParam:{ category:'fruit',     count:50  } },
    { id:86,  name:'水果大师',       icon:'🍒',  category:'collect', hidden:true,  description:'收集全部 100 种水果',         condition:'categoryCollect', conditionParam:{ category:'fruit',     count:100 } },
    { id:87,  name:'谷物收藏家',     icon:'🌾',  category:'collect', hidden:false, description:'收集 50 种谷物',               condition:'categoryCollect', conditionParam:{ category:'grain',     count:50  } },
    { id:88,  name:'药材研究者',     icon:'💊',  category:'collect', hidden:false, description:'收集 50 种药材',               condition:'categoryCollect', conditionParam:{ category:'medicine',  count:50  } },
    { id:89,  name:'花卉鉴赏家',     icon:'🌸',  category:'collect', hidden:false, description:'收集 50 种花卉',               condition:'categoryCollect', conditionParam:{ category:'flower',    count:50  } },
    { id:90,  name:'热带探险家',     icon:'🥥',  category:'collect', hidden:false, description:'收集 50 种热带作物',           condition:'categoryCollect', conditionParam:{ category:'tropical',  count:50  } },
    { id:91,  name:'菌类专家',       icon:'🍄',  category:'collect', hidden:false, description:'收集 50 种菌类',               condition:'categoryCollect', conditionParam:{ category:'mushroom',  count:50  } },
    { id:92,  name:'香料调配师',     icon:'🌶️',  category:'collect', hidden:false, description:'收集 50 种香料',               condition:'categoryCollect', conditionParam:{ category:'spice',     count:50  } },
    { id:93,  name:'魔法学徒',       icon:'✨',  category:'collect', hidden:false, description:'收集 50 种魔法植物',           condition:'categoryCollect', conditionParam:{ category:'magic',     count:50  } },
    { id:94,  name:'传说追寻者',     icon:'🐉',  category:'collect', hidden:true,  description:'收集 50 种传说作物',           condition:'categoryCollect', conditionParam:{ category:'legend',    count:50  } },
    { id:95,  name:'图鉴收藏家',     icon:'📖',  category:'collect', hidden:false, description:'收集 100 种不同作物',          condition:'cropCollect',     conditionParam:100  },
    { id:96,  name:'图鉴完成者',     icon:'📕',  category:'collect', hidden:false, description:'收集 500 种不同作物',          condition:'cropCollect',     conditionParam:500  },
    { id:97,  name:'全图鉴大师',     icon:'📗',  category:'collect', hidden:true,  description:'收集全部 1000 种作物',        condition:'cropCollect',     conditionParam:1000 },
    { id:98,  name:'初次加工品',     icon:'🍞',  category:'collect', hidden:false, description:'制作 1 种加工品',              condition:'productCollect',  conditionParam:1    },
    { id:99,  name:'加工品收藏家',   icon:'🍰',  category:'collect', hidden:false, description:'制作 10 种加工品',             condition:'productCollect',  conditionParam:10   },
    { id:100, name:'加工品大师',     icon:'🧁',  category:'collect', hidden:false, description:'制作 50 种加工品',             condition:'productCollect',  conditionParam:50   },
    { id:101, name:'加工品之王',     icon:'🎂',  category:'collect', hidden:true,  description:'制作 100 种加工品',            condition:'productCollect',  conditionParam:100  },
    { id:102, name:'皮肤初体验',     icon:'🎨',  category:'collect', hidden:false, description:'使用 2 种皮肤',                condition:'skinUsed',        conditionParam:2    },
    { id:103, name:'换装达人',       icon:'👗',  category:'collect', hidden:false, description:'使用 5 种皮肤',                condition:'skinUsed',        conditionParam:5    },
    { id:104, name:'时尚农夫',       icon:'💃',  category:'collect', hidden:false, description:'使用 10 种皮肤',               condition:'skinUsed',        conditionParam:10   },
    { id:105, name:'收藏家',         icon:'🏆',  category:'collect', hidden:true,  description:'集齐所有皮肤',                 condition:'skinUsed',        conditionParam:50   },

    /* ========== 六、天数/时间类 106-120 ========== */
    { id:106, name:'新手农夫',       icon:'📅',  category:'day',     hidden:false, description:'生存 7 天',                    condition:'dayReached',   conditionParam:7      },
    { id:107, name:'农场主人',       icon:'🗓️',  category:'day',     hidden:false, description:'生存 30 天',                   condition:'dayReached',   conditionParam:30     },
    { id:108, name:'农场老手',       icon:'📆',  category:'day',     hidden:false, description:'生存 100 天',                  condition:'dayReached',   conditionParam:100    },
    { id:109, name:'农场大师',       icon:'🎯',  category:'day',     hidden:false, description:'生存 365 天',                  condition:'dayReached',   conditionParam:365    },
    { id:110, name:'一年四季',       icon:'🍂',  category:'day',     hidden:false, description:'经历 4 个季节',                condition:'seasonSeen',   conditionParam:4      },
    { id:111, name:'百年农场',       icon:'⏳',  category:'day',     hidden:true,  description:'生存 1,000 天',                condition:'dayReached',   conditionParam:1000   },
    { id:112, name:'首次接待商人',   icon:'🛎️',  category:'day',     hidden:false, description:'与商人交易 1 次',              condition:'merchantTrade', conditionParam:1     },
    { id:113, name:'商人常客',       icon:'🍵',  category:'day',     hidden:false, description:'与商人交易 10 次',             condition:'merchantTrade', conditionParam:10    },
    { id:114, name:'商人知己',       icon:'🤝',  category:'day',     hidden:false, description:'与商人交易 100 次',            condition:'merchantTrade', conditionParam:100   },
    { id:115, name:'大客户',         icon:'💼',  category:'day',     hidden:true,  description:'单次与商人交易超过 10,000 金币', condition:'special:merchantBig', conditionParam:10000 },
    { id:116, name:'见过所有商人',   icon:'👔',  category:'day',     hidden:false, description:'与 5 位商人各交易过',           condition:'special:allMerchants', conditionParam:5   },
    { id:117, name:'幸运日',         icon:'🍀',  category:'day',     hidden:false, description:'触发 10 次正面事件',            condition:'special:goodEvents',   conditionParam:10  },
    { id:118, name:'倒霉的一天',     icon:'⛈️',  category:'day',     hidden:false, description:'触发 10 次负面事件',            condition:'special:badEvents',    conditionParam:10  },
    { id:119, name:'天气观察员',     icon:'🌤️',  category:'day',     hidden:false, description:'经历所有天气类型',              condition:'weatherSeen',          conditionParam:5   },
    { id:120, name:'风雨无阻',       icon:'🌧️',  category:'day',     hidden:true,  description:'在暴风雨天收获 10 次',          condition:'special:stormHarvest', conditionParam:10  },

    /* ========== 七、特殊类 121-135 ========== */
    { id:121, name:'商人艾米的青睐', icon:'👩‍🌾', category:'special', hidden:false, description:'与艾米交易过',                 condition:'merchantTradeWith', conditionParam:'amy'    },
    { id:122, name:'商人杰克的朋友', icon:'👨‍🌾', category:'special', hidden:false, description:'与杰克交易过',                 condition:'merchantTradeWith', conditionParam:'jack'   },
    { id:123, name:'商人鲍比的搭档', icon:'🧔',  category:'special', hidden:false, description:'与鲍比交易过',                 condition:'merchantTradeWith', conditionParam:'bobby'  },
    { id:124, name:'商人老王的贵宾', icon:'👴',  category:'special', hidden:false, description:'与老王交易过',                 condition:'merchantTradeWith', conditionParam:'laowang'},
    { id:125, name:'商人小新的顾客', icon:'🧒',  category:'special', hidden:false, description:'与小新交易过',                 condition:'merchantTradeWith', conditionParam:'xiaoxin'},
    { id:126, name:'丰收时刻',       icon:'🎊',  category:'special', hidden:true,  description:'单日收获 100 个作物',          condition:'special:harvest100in1day', conditionParam:100 },
    { id:127, name:'连击大师',       icon:'🔥',  category:'special', hidden:true,  description:'连续收获 10 次不中断',          condition:'special:harvestStreak10',  conditionParam:10  },
    { id:128, name:'一次性浇水 50 块', icon:'💦', category:'special', hidden:true,  description:'同时给 50 块地浇水',           condition:'special:water50',    conditionParam:50  },
    { id:129, name:'豪掷千金',       icon:'💎',  category:'special', hidden:true,  description:'单次商城消费超过 10,000 金币',  condition:'special:mallBig',    conditionParam:10000 },
    { id:130, name:'用光所有种子',   icon:'🫙',  category:'special', hidden:true,  description:'仓库种子数为 0',                condition:'special:noSeeds',    conditionParam:0   },
    { id:131, name:'零金币',         icon:'🚫',  category:'special', hidden:true,  description:'金币归零',                      condition:'special:zeroGold',   conditionParam:0   },
    { id:132, name:'库存告急',       icon:'📦',  category:'special', hidden:false, description:'仓库到达上限',                  condition:'special:storageFull', conditionParam:0  },
    { id:133, name:'大手笔',         icon:'🌟',  category:'special', hidden:false, description:'使用传奇肥料',                  condition:'special:useLegendaryFertilizer', conditionParam:1 },
    { id:134, name:'施法者',         icon:'🧪',  category:'special', hidden:true,  description:'使用 5 种不同肥料',             condition:'special:allFertilizers', conditionParam:5 },
    { id:135, name:'满级',           icon:'👑',  category:'special', hidden:true,  description:'达到当前版本最高等级',          condition:'levelReached', conditionParam:500 },

    /* ========== 八、隐藏类 136-150 ========== */
    { id:136, name:'与"龙"同行',     icon:'🐉',  category:'hidden',  hidden:true,  description:'收获 100 个传说作物',           condition:'categoryHarvest', conditionParam:{ category:'legend', count:100 } },
    { id:137, name:'摸鱼的一天',     icon:'😴',  category:'hidden',  hidden:true,  description:'登录但一整天没有种植',           condition:'special:lazyDay',   conditionParam:1  },
    { id:138, name:'熬夜农夫',       icon:'🌙',  category:'hidden',  hidden:true,  description:'凌晨 3-5 点还在玩',              condition:'special:nightOwl',  conditionParam:1  },
    { id:139, name:'早起鸟儿',       icon:'🌅',  category:'hidden',  hidden:true,  description:'凌晨 5-7 点种地',                 condition:'special:earlyBird', conditionParam:1  },
    { id:140, name:'素食主义者',     icon:'🥬',  category:'hidden',  hidden:true,  description:'只种蔬菜累计 500 次',            condition:'categoryHarvest',   conditionParam:{ category:'vegetable', count:500 } },
    { id:141, name:'果粉',           icon:'🍎',  category:'hidden',  hidden:true,  description:'只种水果累计 500 次',            condition:'categoryHarvest',   conditionParam:{ category:'fruit',     count:500 } },
    { id:142, name:'药农',           icon:'💊',  category:'hidden',  hidden:true,  description:'只种药材累计 500 次',            condition:'categoryHarvest',   conditionParam:{ category:'medicine',  count:500 } },
    { id:143, name:'花园主人',       icon:'🌸',  category:'hidden',  hidden:true,  description:'只种花卉累计 500 次',            condition:'categoryHarvest',   conditionParam:{ category:'flower',    count:500 } },
    { id:144, name:'江湖郎中',       icon:'🩺',  category:'hidden',  hidden:true,  description:'使用 10 次植物医生',             condition:'special:usePlantDoctor', conditionParam:10 },
    { id:145, name:'破坏者',         icon:'💥',  category:'hidden',  hidden:true,  description:'挖掉 50 个作物',                 condition:'special:digCrops',       conditionParam:50 },
    { id:146, name:'慈善家',         icon:'🎗️',  category:'hidden',  hidden:true,  description:'累计损失 10,000 金币',           condition:'special:lostGold',       conditionParam:10000 },
    { id:147, name:'破产边缘',       icon:'💔',  category:'hidden',  hidden:true,  description:'金币低于 10',                    condition:'special:lowGold',        conditionParam:10 },
    { id:148, name:'无限接近',       icon:'🎯',  category:'hidden',  hidden:true,  description:'经验刚好差 1 点升级',             condition:'special:almostLevel',    conditionParam:1  },
    { id:149, name:'全收集爱好者',   icon:'🗃️',  category:'hidden',  hidden:true,  description:'同时拥有所有分类的作物',         condition:'special:allCategories',  conditionParam:10 },
    { id:150, name:'完美主义者',     icon:'🌟',  category:'hidden',  hidden:true,  description:'完成所有非隐藏成就',             condition:'special:allNonHidden',   conditionParam:135 },
];

/* ============================================================
   查询辅助
   ============================================================ */

/**
 * 根据 id 获取成就
 */
function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id) || null;
}

/**
 * 获取所有非隐藏成就
 */
function getVisibleAchievements() {
    return ACHIEVEMENTS.filter(a => !a.hidden);
}

/**
 * 获取所有隐藏成就
 */
function getHiddenAchievements() {
    return ACHIEVEMENTS.filter(a => a.hidden);
}

/**
 * 获取某分类下的成就
 */
function getAchievementsByCategory(category) {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * 按分类统计成就数量
 */
function getAchievementCategoryStats() {
    const stats = {
        farm: 0, harvest: 0, economy: 0, level: 0,
        collect: 0, day: 0, special: 0, hidden: 0,
    };
    for (const a of ACHIEVEMENTS) {
        stats[a.category] = (stats[a.category] || 0) + 1;
    }
    return stats;
}