/* ============================================================
   factoryproducts_5.js  —  5-9 级加工品（共 43 条）
   版本：v1.0.1
   规则：n 级产品至少包含 1 个 (n-1) 级产品
        额外材料可来自 (n-3) ~ (n-1) 级
   id 分配：
     5 级 4001-4015（15 条）
     6 级 4016-4025（10 条）
     7 级 4026-4033（8 条）
     8 级 4034-4039（6 条）
     9 级 4040-4043（4 条）
   ============================================================ */

FACTORY_PRODUCTS_LV5_9 = [
/* ===== 5 级 4001-4015 ===== */
{id:4001,name:'皇家满汉宴',icon:'👑',level:5,category:'food',description:'满汉全席与田园风光套餐的皇家宴',requirements:[{productId:3001,amount:3},{productId:3002,amount:3},{productId:2001,amount:2}],processingTime:8,processingCost:100000,sellPrice:2000000,unlockLevel:180},
{id:4002,name:'双拼暖锅套餐',icon:'🍲',level:5,category:'food',description:'暖锅双拼套餐与小菜三鲜套餐融合',requirements:[{productId:3003,amount:3},{productId:3004,amount:3},{productId:2005,amount:2}],processingTime:8,processingCost:120000,sellPrice:2200000,unlockLevel:182},
{id:4003,name:'菌菇盛宴套餐',icon:'🍲',level:5,category:'food',description:'竹笋盛宴套餐与菌菇养生套餐融合',requirements:[{productId:3005,amount:3},{productId:3006,amount:3},{productId:2009,amount:2}],processingTime:8,processingCost:140000,sellPrice:2400000,unlockLevel:184},
{id:4004,name:'松露鸭菇套餐',icon:'🍝',level:5,category:'food',description:'松露豪华套餐与鸭菇双味套餐融合',requirements:[{productId:3007,amount:3},{productId:3008,amount:3},{productId:2013,amount:2}],processingTime:8,processingCost:160000,sellPrice:2600000,unlockLevel:186},
{id:4005,name:'海鲜凤尾套餐',icon:'🍛',level:5,category:'food',description:'海鲜烩饭套餐与凤尾鲍鱼套餐融合',requirements:[{productId:3009,amount:3},{productId:3010,amount:3},{productId:2017,amount:2}],processingTime:8,processingCost:180000,sellPrice:2800000,unlockLevel:188},
{id:4006,name:'珊瑚菌王套餐 V',icon:'🥗',level:5,category:'food',description:'珊瑚菌王套餐与竹荪鸡枞套餐融合',requirements:[{productId:3011,amount:3},{productId:3012,amount:3},{productId:2021,amount:2}],processingTime:8,processingCost:200000,sellPrice:3000000,unlockLevel:190},
{id:4007,name:'红菇传说套餐',icon:'🍲',level:5,category:'food',description:'红菇榛蘑套餐与传说松露套餐融合',requirements:[{productId:3013,amount:3},{productId:3014,amount:3},{productId:2025,amount:2}],processingTime:8,processingCost:220000,sellPrice:3200000,unlockLevel:192},
{id:4008,name:'菌王仙灵套餐',icon:'🥣',level:5,category:'food',description:'菌王双汤套餐与仙灵星辰套餐融合',requirements:[{productId:3015,amount:3},{productId:3016,amount:3},{productId:2029,amount:2}],processingTime:8,processingCost:240000,sellPrice:3400000,unlockLevel:194},
{id:4009,name:'龙血混沌套餐',icon:'🍲',level:5,category:'food',description:'龙血凤凰套餐与混沌创世套餐融合',requirements:[{productId:3017,amount:3},{productId:3018,amount:3},{productId:2033,amount:2}],processingTime:8,processingCost:260000,sellPrice:3600000,unlockLevel:196},
{id:4010,name:'仙灵芝极光套餐',icon:'🥗',level:5,category:'food',description:'仙灵芝药膳与极光彩虹套餐融合',requirements:[{productId:3019,amount:3},{productId:3020,amount:3},{productId:2037,amount:2}],processingTime:8,processingCost:280000,sellPrice:3800000,unlockLevel:198},
{id:4011,name:'神之创世套餐',icon:'🍅',level:5,category:'food',description:'神之番茄套餐与月光太阳谷套餐融合',requirements:[{productId:3021,amount:3},{productId:3022,amount:3},{productId:2041,amount:2}],processingTime:8,processingCost:300000,sellPrice:4000000,unlockLevel:200},
{id:4012,name:'经典玫瑰双露饮',icon:'🍸',level:5,category:'drink',description:'经典玫瑰饮套餐与樱花牡丹清饮融合',requirements:[{productId:3026,amount:3},{productId:3027,amount:3},{productId:2051,amount:2}],processingTime:8,processingCost:100000,sellPrice:2100000,unlockLevel:200},
{id:4013,name:'铃兰栀子雅饮',icon:'🍸',level:5,category:'drink',description:'铃兰紫罗兰雅饮与栀子薰衣草饮融合',requirements:[{productId:3028,amount:3},{productId:3029,amount:3},{productId:2055,amount:2}],processingTime:8,processingCost:130000,sellPrice:2300000,unlockLevel:202},
{id:4014,name:'桂花五香雅饮',icon:'🥤',level:5,category:'drink',description:'桂花山茶花饮与五香麻辣饮融合',requirements:[{productId:3030,amount:3},{productId:3031,amount:3},{productId:2059,amount:2}],processingTime:8,processingCost:160000,sellPrice:2500000,unlockLevel:204},
{id:4015,name:'孜然麻辣双饮',icon:'🥤',level:5,category:'drink',description:'孜然火锅饮与麻辣炖肉饮融合',requirements:[{productId:3032,amount:3},{productId:3033,amount:3},{productId:2063,amount:2}],processingTime:8,processingCost:190000,sellPrice:2700000,unlockLevel:206},

/* ===== 6 级 4016-4025 ===== */
{id:4016,name:'皇家双宴',icon:'👑',level:6,category:'food',description:'皇家满汉宴与双拼暖锅套餐的顶级宴席',requirements:[{productId:4001,amount:3},{productId:4002,amount:3},{productId:3001,amount:2}],processingTime:10,processingCost:500000,sellPrice:6000000,unlockLevel:210},
{id:4017,name:'菌菇松露宴',icon:'🍲',level:6,category:'food',description:'菌菇盛宴套餐与松露鸭菇套餐组合',requirements:[{productId:4003,amount:3},{productId:4004,amount:3},{productId:3005,amount:2}],processingTime:10,processingCost:550000,sellPrice:6600000,unlockLevel:212},
{id:4018,name:'海鲜菌王宴',icon:'🍛',level:6,category:'food',description:'海鲜凤尾套餐与珊瑚菌王套餐组合',requirements:[{productId:4005,amount:3},{productId:4006,amount:3},{productId:3009,amount:2}],processingTime:10,processingCost:600000,sellPrice:7200000,unlockLevel:214},
{id:4019,name:'红菇菌王宴',icon:'🍲',level:6,category:'food',description:'红菇传说套餐与菌王仙灵套餐组合',requirements:[{productId:4007,amount:3},{productId:4008,amount:3},{productId:3013,amount:2}],processingTime:10,processingCost:650000,sellPrice:7800000,unlockLevel:216},
{id:4020,name:'龙血仙灵宴',icon:'🍲',level:6,category:'food',description:'龙血混沌套餐与仙灵芝极光套餐组合',requirements:[{productId:4009,amount:3},{productId:4010,amount:3},{productId:3017,amount:2}],processingTime:10,processingCost:700000,sellPrice:8400000,unlockLevel:218},
{id:4021,name:'神之创世顶级宴',icon:'🍅',level:6,category:'food',description:'神之创世套餐与皇家满汉宴组合',requirements:[{productId:4011,amount:3},{productId:4001,amount:3},{productId:3021,amount:2}],processingTime:10,processingCost:750000,sellPrice:9000000,unlockLevel:220},
{id:4022,name:'玫瑰铃兰顶级饮',icon:'🍸',level:6,category:'drink',description:'经典玫瑰双露饮与铃兰栀子雅饮组合',requirements:[{productId:4012,amount:3},{productId:4013,amount:3},{productId:3026,amount:2}],processingTime:10,processingCost:800000,sellPrice:9600000,unlockLevel:222},
{id:4023,name:'桂花孜然顶级饮',icon:'🥤',level:6,category:'drink',description:'桂花五香雅饮与孜然麻辣双饮组合',requirements:[{productId:4014,amount:3},{productId:4015,amount:3},{productId:3030,amount:2}],processingTime:10,processingCost:850000,sellPrice:10200000,unlockLevel:224},
{id:4024,name:'皇家菌菇顶级宴',icon:'👑',level:6,category:'food',description:'皇家双宴与菌菇松露宴组合',requirements:[{productId:4016,amount:3},{productId:4017,amount:3},{productId:4003,amount:2}],processingTime:10,processingCost:900000,sellPrice:10800000,unlockLevel:226},
{id:4025,name:'海鲜龙血顶级宴',icon:'🍛',level:6,category:'food',description:'海鲜菌王宴与龙血仙灵宴组合',requirements:[{productId:4018,amount:3},{productId:4020,amount:3},{productId:4009,amount:2}],processingTime:10,processingCost:1000000,sellPrice:12000000,unlockLevel:230},

/* ===== 7 级 4026-4033 ===== */
{id:4026,name:'至尊皇家宴',icon:'👑',level:7,category:'food',description:'皇家双宴与菌菇松露宴的至尊融合',requirements:[{productId:4016,amount:3},{productId:4017,amount:3},{productId:4001,amount:2}],processingTime:12,processingCost:2000000,sellPrice:18000000,unlockLevel:240},
{id:4027,name:'至尊海鲜宴',icon:'🍛',level:7,category:'food',description:'海鲜菌王宴与红菇菌王宴的至尊融合',requirements:[{productId:4018,amount:3},{productId:4019,amount:3},{productId:4005,amount:2}],processingTime:12,processingCost:2200000,sellPrice:20000000,unlockLevel:242},
{id:4028,name:'至尊龙血宴',icon:'🍲',level:7,category:'food',description:'龙血仙灵宴与神之创世顶级宴的至尊融合',requirements:[{productId:4020,amount:3},{productId:4021,amount:3},{productId:4009,amount:2}],processingTime:12,processingCost:2400000,sellPrice:22000000,unlockLevel:244},
{id:4029,name:'至尊玫瑰饮',icon:'🍸',level:7,category:'drink',description:'玫瑰铃兰顶级饮与桂花孜然顶级饮的至尊融合',requirements:[{productId:4022,amount:3},{productId:4023,amount:3},{productId:4012,amount:2}],processingTime:12,processingCost:2600000,sellPrice:24000000,unlockLevel:246},
{id:4030,name:'至尊皇菌宴',icon:'👑',level:7,category:'food',description:'皇家菌菇顶级宴与海鲜龙血顶级宴的至尊融合',requirements:[{productId:4024,amount:3},{productId:4025,amount:3},{productId:4016,amount:2}],processingTime:12,processingCost:2800000,sellPrice:26000000,unlockLevel:248},
{id:4031,name:'双至尊宴',icon:'🍱',level:7,category:'food',description:'至尊皇家宴与至尊海鲜宴的至尊双拼',requirements:[{productId:4026,amount:3},{productId:4027,amount:3},{productId:4018,amount:2}],processingTime:12,processingCost:3000000,sellPrice:28000000,unlockLevel:250},
{id:4032,name:'至尊龙血海鲜宴',icon:'🍲',level:7,category:'food',description:'至尊龙血宴与至尊玫瑰饮的双至尊组合',requirements:[{productId:4028,amount:3},{productId:4029,amount:3},{productId:4020,amount:2}],processingTime:12,processingCost:3200000,sellPrice:30000000,unlockLevel:252},
{id:4033,name:'三至尊盛宴',icon:'👑',level:7,category:'food',description:'至尊皇菌宴、双至尊宴与至尊龙血宴三宴合一',requirements:[{productId:4030,amount:3},{productId:4031,amount:3},{productId:4032,amount:2}],processingTime:12,processingCost:3500000,sellPrice:34000000,unlockLevel:255},

/* ===== 8 级 4034-4039 ===== */
{id:4034,name:'传说之宴·壹',icon:'📜',level:8,category:'food',description:'至尊皇家宴与至尊海鲜宴的传说级融合',requirements:[{productId:4026,amount:3},{productId:4027,amount:3},{productId:4016,amount:2}],processingTime:15,processingCost:8000000,sellPrice:50000000,unlockLevel:270},
{id:4035,name:'传说之宴·贰',icon:'📜',level:8,category:'food',description:'至尊龙血宴与至尊玫瑰饮的传说级融合',requirements:[{productId:4028,amount:3},{productId:4029,amount:3},{productId:4018,amount:2}],processingTime:15,processingCost:9000000,sellPrice:56000000,unlockLevel:273},
{id:4036,name:'传说之宴·叁',icon:'📜',level:8,category:'food',description:'至尊皇菌宴与双至尊宴的传说级融合',requirements:[{productId:4030,amount:3},{productId:4031,amount:3},{productId:4020,amount:2}],processingTime:15,processingCost:10000000,sellPrice:62000000,unlockLevel:276},
{id:4037,name:'传说之宴·肆',icon:'📜',level:8,category:'food',description:'至尊龙血海鲜宴与三至尊盛宴的传说级融合',requirements:[{productId:4032,amount:3},{productId:4033,amount:3},{productId:4022,amount:2}],processingTime:15,processingCost:11000000,sellPrice:68000000,unlockLevel:279},
{id:4038,name:'传说之宴·伍',icon:'📜',level:8,category:'food',description:'至尊皇家宴与至尊皇菌宴的传说级融合',requirements:[{productId:4026,amount:3},{productId:4030,amount:3},{productId:4024,amount:2}],processingTime:15,processingCost:12000000,sellPrice:74000000,unlockLevel:282},
{id:4039,name:'传说之宴·终',icon:'📜',level:8,category:'food',description:'至尊海鲜宴与三至尊盛宴的终极融合',requirements:[{productId:4027,amount:3},{productId:4033,amount:3},{productId:4025,amount:2}],processingTime:15,processingCost:13000000,sellPrice:80000000,unlockLevel:285},

/* ===== 9 级 4040-4043 ===== */
{id:4040,name:'神之宴·开天',icon:'👑',level:9,category:'magic',description:'传说之宴·壹与传说之宴·贰的神级融合',requirements:[{productId:4034,amount:3},{productId:4035,amount:3},{productId:4026,amount:2}],processingTime:20,processingCost:40000000,sellPrice:200000000,unlockLevel:295},
{id:4041,name:'神之宴·辟地',icon:'👑',level:9,category:'magic',description:'传说之宴·叁与传说之宴·肆的神级融合',requirements:[{productId:4036,amount:3},{productId:4037,amount:3},{productId:4027,amount:2}],processingTime:20,processingCost:45000000,sellPrice:230000000,unlockLevel:297},
{id:4042,name:'神之宴·创世',icon:'👑',level:9,category:'magic',description:'传说之宴·伍与传说之宴·终的神级融合',requirements:[{productId:4038,amount:3},{productId:4039,amount:3},{productId:4028,amount:2}],processingTime:20,processingCost:50000000,sellPrice:260000000,unlockLevel:298},
{id:4043,name:'神之宴·永恒',icon:'👑',level:9,category:'magic',description:'神之宴·开天、辟地、创世三宴合一的终极神宴',requirements:[{productId:4040,amount:3},{productId:4041,amount:3},{productId:4042,amount:2}],processingTime:25,processingCost:80000000,sellPrice:500000000,unlockLevel:300},
];