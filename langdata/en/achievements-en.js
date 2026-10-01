/* ============================================================
   achievements.js  —  150 Achievements
   Version: v1.0.1

   Categories:
     farm      Planting / watering / tilling
     harvest   Harvesting
     economy   Economy / trading
     level     Level / experience
     collect   Collection / catalog
     day       Days / time
     special   Special events
     hidden    Hidden achievements (conditions not shown)

   Condition types:
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
     special:xxx (custom check)
   ============================================================ */

const ACHIEVEMENTS = [

    /* ========== I. Farming 1-20 ========== */
    { id:1,   name:'First Farming',          icon:'🌱',  category:'farm',    hidden:false, description:'Plant your first seed',                     condition:'plantCount',    conditionParam:1      },
    { id:2,   name:'First Attempt',          icon:'🌿',  category:'farm',    hidden:false, description:'Plant 10 seeds',                            condition:'plantCount',    conditionParam:10     },
    { id:3,   name:'Diligent Hands',         icon:'👨‍🌾', category:'farm',    hidden:false, description:'Plant 100 seeds',                           condition:'plantCount',    conditionParam:100    },
    { id:4,   name:'Practice Makes Perfect', icon:'🧑‍🌾', category:'farm',    hidden:false, description:'Plant 500 seeds',                           condition:'plantCount',    conditionParam:500    },
    { id:5,   name:'Steeled by Trial',       icon:'💪',  category:'farm',    hidden:false, description:'Plant 1,000 seeds',                         condition:'plantCount',    conditionParam:1000   },
    { id:6,   name:'Master Planter',         icon:'🏅',  category:'farm',    hidden:false, description:'Plant 5,000 seeds',                         condition:'plantCount',    conditionParam:5000   },
    { id:7,   name:'Seed Collector',         icon:'🎖️',  category:'farm',    hidden:false, description:'Plant 10,000 seeds',                        condition:'plantCount',    conditionParam:10000  },
    { id:8,   name:'Vast Farmland',          icon:'🌾',  category:'farm',    hidden:false, description:'Plant 50,000 seeds',                        condition:'plantCount',    conditionParam:50000  },
    { id:9,   name:'Endless Labour',         icon:'♾️',  category:'farm',    hidden:true,  description:'Plant 100,000 seeds',                       condition:'plantCount',    conditionParam:100000 },
    { id:10,  name:'Watering Apprentice',    icon:'💧',  category:'farm',    hidden:false, description:'Water 10 times',                            condition:'waterCount',    conditionParam:10     },
    { id:11,  name:'Irrigation Expert',      icon:'🚿',  category:'farm',    hidden:false, description:'Water 100 times',                           condition:'waterCount',    conditionParam:100    },
    { id:12,  name:'Master of Water',        icon:'🌊',  category:'farm',    hidden:false, description:'Water 1,000 times',                         condition:'waterCount',    conditionParam:1000   },
    { id:13,  name:'Tilling Novice',         icon:'🪓',  category:'farm',    hidden:false, description:'Till the soil once',                        condition:'tillCount',     conditionParam:1      },
    { id:14,  name:'Tilling Adept',          icon:'⛏️',  category:'farm',    hidden:false, description:'Till the soil 100 times',                   condition:'tillCount',     conditionParam:100    },
    { id:15,  name:'Tilling Master',         icon:'🔨',  category:'farm',    hidden:false, description:'Till the soil 1,000 times',                 condition:'tillCount',     conditionParam:1000   },
    { id:16,  name:'Land Devotee',           icon:'🌍',  category:'farm',    hidden:false, description:'Till the soil 10,000 times',                condition:'tillCount',     conditionParam:10000  },
    { id:17,  name:'Greenhouse Gardener',    icon:'🏠',  category:'farm',    hidden:false, description:'Use a greenhouse for 30 cumulative days',   condition:'special:greenhouse30',    conditionParam:30  },
    { id:18,  name:'Perfect Watering',       icon:'✨',  category:'farm',    hidden:true,  description:'Water 100 plots in a single day',           condition:'special:water100in1day',  conditionParam:100 },
    { id:19,  name:'Fertilizer Expert',      icon:'🧪',  category:'farm',    hidden:false, description:'Use fertilizer 100 times',                  condition:'special:fertilizer100',   conditionParam:100 },
    { id:20,  name:'Green Thumb',            icon:'🌱',  category:'farm',    hidden:true,  description:'Plant 10+ times a day for 7 days straight', condition:'special:plantStreak7',    conditionParam:7   },

    /* ========== II. Harvesting 21-40 ========== */
    { id:21,  name:'First Harvest',          icon:'🧺',  category:'harvest', hidden:false, description:'Harvest once',                              condition:'harvestCount',    conditionParam:1      },
    { id:22,  name:'Joy of Harvest',         icon:'🍎',  category:'harvest', hidden:false, description:'Harvest 10 times',                          condition:'harvestCount',    conditionParam:10     },
    { id:23,  name:'Small Yield',            icon:'🌾',  category:'harvest', hidden:false, description:'Harvest 100 times',                         condition:'harvestCount',    conditionParam:100    },
    { id:24,  name:'Year of Bounty',         icon:'🎉',  category:'harvest', hidden:false, description:'Harvest 1,000 times',                       condition:'harvestCount',    conditionParam:1000   },
    { id:25,  name:'Bumper Harvest',         icon:'🏆',  category:'harvest', hidden:false, description:'Harvest 5,000 times',                       condition:'harvestCount',    conditionParam:5000   },
    { id:26,  name:'Harvest Master',         icon:'👑',  category:'harvest', hidden:false, description:'Harvest 10,000 times',                      condition:'harvestCount',    conditionParam:10000  },
    { id:27,  name:'Ten Thousand Stored',    icon:'📦',  category:'harvest', hidden:false, description:'Harvest 50,000 times',                      condition:'harvestCount',    conditionParam:50000  },
    { id:28,  name:'Overflowing Granary',    icon:'🏬',  category:'harvest', hidden:true,  description:'Harvest 100,000 times',                     condition:'harvestCount',    conditionParam:100000 },
    { id:29,  name:'Fragrant Rice',          icon:'🍚',  category:'harvest', hidden:false, description:'Harvest 100 Rice in total',                 condition:'cropHarvest',     conditionParam:{ name:'水稻', count:100 } },
    { id:30,  name:'Wheat Empire',           icon:'🌾',  category:'harvest', hidden:false, description:'Harvest 1,000 Wheat in total',              condition:'cropHarvest',     conditionParam:{ name:'小麦', count:1000 } },
    { id:31,  name:'Pumpkin King',           icon:'🎃',  category:'harvest', hidden:false, description:'Harvest 500 Pumpkins in total',             condition:'cropHarvest',     conditionParam:{ name:'南瓜', count:500 } },
    { id:32,  name:'Watermelon Tycoon',      icon:'🍉',  category:'harvest', hidden:false, description:'Harvest 500 Watermelons in total',          condition:'cropHarvest',     conditionParam:{ name:'西瓜', count:500 } },
    { id:33,  name:'Strawberry Addict',      icon:'🍓',  category:'harvest', hidden:false, description:'Harvest 1,000 Strawberries in total',       condition:'cropHarvest',     conditionParam:{ name:'草莓', count:1000 } },
    { id:34,  name:'Blueberry Buff',         icon:'🫐',  category:'harvest', hidden:false, description:'Harvest 500 Blueberries in total',          condition:'cropHarvest',     conditionParam:{ name:'蓝莓', count:500 } },
    { id:35,  name:'Mushroom Hunter',        icon:'🍄',  category:'harvest', hidden:false, description:'Harvest 500 mushrooms in total',            condition:'categoryHarvest', conditionParam:{ category:'mushroom', count:500 } },
    { id:36,  name:'Spice Master',           icon:'🌶️',  category:'harvest', hidden:false, description:'Harvest 500 spices in total',               condition:'categoryHarvest', conditionParam:{ category:'spice',    count:500 } },
    { id:37,  name:'Herb Hunter',            icon:'💊',  category:'harvest', hidden:false, description:'Harvest 500 herbs in total',                condition:'categoryHarvest', conditionParam:{ category:'medicine', count:500 } },
    { id:38,  name:'Flower Gardener',        icon:'🌸',  category:'harvest', hidden:false, description:'Harvest 500 flowers in total',              condition:'categoryHarvest', conditionParam:{ category:'flower',   count:500 } },
    { id:39,  name:'Tropical Storm',         icon:'🥥',  category:'harvest', hidden:false, description:'Harvest 500 tropical crops in total',       condition:'categoryHarvest', conditionParam:{ category:'tropical', count:500 } },
    { id:40,  name:'Witness of Legend',      icon:'🐉',  category:'harvest', hidden:true,  description:'Harvest 1 legendary crop',                  condition:'categoryHarvest', conditionParam:{ category:'legend',   count:1   } },

    /* ========== III. Economy 41-65 ========== */
    { id:41,  name:'First Pot of Gold',      icon:'💰',  category:'economy', hidden:false, description:'Earn 100 gold in total',               condition:'goldEarned',  conditionParam:100         },
    { id:42,  name:'Comfortably Well-Off',   icon:'💵',  category:'economy', hidden:false, description:'Earn 1,000 gold in total',             condition:'goldEarned',  conditionParam:1000        },
    { id:43,  name:'Rolling in Coin',        icon:'💴',  category:'economy', hidden:false, description:'Earn 10,000 gold in total',            condition:'goldEarned',  conditionParam:10000       },
    { id:44,  name:'Regional Rich',          icon:'🏦',  category:'economy', hidden:false, description:'Earn 100,000 gold in total',           condition:'goldEarned',  conditionParam:100000      },
    { id:45,  name:'Millionaire',            icon:'💎',  category:'economy', hidden:false, description:'Earn 1,000,000 gold in total',         condition:'goldEarned',  conditionParam:1000000     },
    { id:46,  name:'Ten Million Tycoon',     icon:'💠',  category:'economy', hidden:false, description:'Earn 10,000,000 gold in total',        condition:'goldEarned',  conditionParam:10000000    },
    { id:47,  name:'Billionaire',            icon:'👑',  category:'economy', hidden:true,  description:'Earn 100,000,000 gold in total',       condition:'goldEarned',  conditionParam:100000000   },
    { id:48,  name:'Spendthrift',            icon:'💸',  category:'economy', hidden:false, description:'Spend 10,000 gold in total',           condition:'goldSpent',   conditionParam:10000       },
    { id:49,  name:'Consumerist',            icon:'🛍️',  category:'economy', hidden:false, description:'Spend 100,000 gold in total',          condition:'goldSpent',   conditionParam:100000      },
    { id:50,  name:'Big Spender',            icon:'🎰',  category:'economy', hidden:true,  description:'Spend 1,000,000 gold in total',        condition:'goldSpent',   conditionParam:1000000     },
    { id:51,  name:'First Sale',             icon:'🤝',  category:'economy', hidden:false, description:'Sell your first item',                 condition:'itemSold',    conditionParam:1           },
    { id:52,  name:'Merchant\'s Friend',     icon:'🎩',  category:'economy', hidden:false, description:'Sell 100 items',                       condition:'itemSold',    conditionParam:100         },
    { id:53,  name:'Business Partner',       icon:'💼',  category:'economy', hidden:false, description:'Sell 1,000 items',                     condition:'itemSold',    conditionParam:1000        },
    { id:54,  name:'Trade Master',           icon:'🏪',  category:'economy', hidden:false, description:'Sell 10,000 items',                    condition:'itemSold',    conditionParam:10000       },
    { id:55,  name:'First Consignment',      icon:'📮',  category:'economy', hidden:false, description:'List your first consignment',          condition:'consignmentSold', conditionParam:1       },
    { id:56,  name:'Consignment Veteran',    icon:'📦',  category:'economy', hidden:false, description:'Successfully consign 10 times',        condition:'consignmentSold', conditionParam:10      },
    { id:57,  name:'Consignment Master',     icon:'📬',  category:'economy', hidden:false, description:'Successfully consign 100 times',       condition:'consignmentSold', conditionParam:100     },
    { id:58,  name:'Auction Rookie',         icon:'🔨',  category:'economy', hidden:false, description:'Win your first auction',               condition:'auctionWin',  conditionParam:1           },
    { id:59,  name:'Auction Veteran',        icon:'🔔',  category:'economy', hidden:false, description:'Win 10 auctions',                      condition:'auctionWin',  conditionParam:10          },
    { id:60,  name:'Auction Master',         icon:'🏆',  category:'economy', hidden:false, description:'Win 100 auctions',                     condition:'auctionWin',  conditionParam:100         },
    { id:61,  name:'First Processing',       icon:'🏭',  category:'economy', hidden:false, description:'Process something once',               condition:'factoryRun',  conditionParam:1           },
    { id:62,  name:'Processing Adept',       icon:'⚙️',  category:'economy', hidden:false, description:'Process 100 times',                    condition:'factoryRun',  conditionParam:100         },
    { id:63,  name:'Processing Master',      icon:'🔧',  category:'economy', hidden:false, description:'Process 1,000 times',                  condition:'factoryRun',  conditionParam:1000        },
    { id:64,  name:'God of Processing',      icon:'⚗️',  category:'economy', hidden:true,  description:'Process 10,000 times',                 condition:'factoryRun',  conditionParam:10000       },
    { id:65,  name:'Frugal Manager',         icon:'🧮',  category:'economy', hidden:true,  description:'Earn 10,000 gold in a single deal',    condition:'special:earnBig', conditionParam:10000   },

    /* ========== IV. Level / EXP 66-80 ========== */
    { id:66,  name:'Greenhorn',              icon:'⭐',  category:'level',   hidden:false, description:'Reach level 5',                  condition:'levelReached', conditionParam:5       },
    { id:67,  name:'Rising Star',            icon:'🌟',  category:'level',   hidden:false, description:'Reach level 10',                 condition:'levelReached', conditionParam:10      },
    { id:68,  name:'Somewhat Famous',        icon:'✨',  category:'level',   hidden:false, description:'Reach level 25',                 condition:'levelReached', conditionParam:25      },
    { id:69,  name:'Rising Fame',            icon:'💫',  category:'level',   hidden:false, description:'Reach level 50',                 condition:'levelReached', conditionParam:50      },
    { id:70,  name:'World Renown',           icon:'🎇',  category:'level',   hidden:false, description:'Reach level 75',                 condition:'levelReached', conditionParam:75      },
    { id:71,  name:'Center of Attention',    icon:'🌈',  category:'level',   hidden:false, description:'Reach level 100',                condition:'levelReached', conditionParam:100     },
    { id:72,  name:'Legendary Farmer',       icon:'🏅',  category:'level',   hidden:false, description:'Reach level 150',                condition:'levelReached', conditionParam:150     },
    { id:73,  name:'Mythic Farmer',          icon:'👑',  category:'level',   hidden:false, description:'Reach level 200',                condition:'levelReached', conditionParam:200     },
    { id:74,  name:'Transcendent',           icon:'🌌',  category:'level',   hidden:true,  description:'Reach level 250',                condition:'levelReached', conditionParam:250     },
    { id:75,  name:'Immortal',               icon:'♾️',  category:'level',   hidden:true,  description:'Reach level 300',                condition:'levelReached', conditionParam:300     },
    { id:76,  name:'EXP Collector',          icon:'📘',  category:'level',   hidden:false, description:'Earn 10,000 EXP in total',       condition:'expTotal',     conditionParam:10000   },
    { id:77,  name:'EXP Master',             icon:'📚',  category:'level',   hidden:false, description:'Earn 100,000 EXP in total',      condition:'expTotal',     conditionParam:100000  },
    { id:78,  name:'God of EXP',             icon:'🧠',  category:'level',   hidden:true,  description:'Earn 1,000,000 EXP in total',    condition:'expTotal',     conditionParam:1000000 },
    { id:79,  name:'First Expansion',        icon:'🗺️',  category:'level',   hidden:false, description:'Own 10 plots',                   condition:'landOwned',    conditionParam:10      },
    { id:80,  name:'Land Tycoon',            icon:'🏞️',  category:'level',   hidden:false, description:'Own 50 plots',                   condition:'landOwned',    conditionParam:50      },

    /* ========== V. Collection 81-105 ========== */
    { id:81,  name:'Vegetable Novice',       icon:'🥬',  category:'collect', hidden:false, description:'Collect 10 vegetable types',          condition:'categoryCollect', conditionParam:{ category:'vegetable', count:10  } },
    { id:82,  name:'Vegetable Expert',       icon:'🥦',  category:'collect', hidden:false, description:'Collect 50 vegetable types',          condition:'categoryCollect', conditionParam:{ category:'vegetable', count:50  } },
    { id:83,  name:'Vegetable Master',       icon:'🥕',  category:'collect', hidden:true,  description:'Collect all 100 vegetable types',     condition:'categoryCollect', conditionParam:{ category:'vegetable', count:100 } },
    { id:84,  name:'Fruit Lover',            icon:'🍎',  category:'collect', hidden:false, description:'Collect 10 fruit types',              condition:'categoryCollect', conditionParam:{ category:'fruit',     count:10  } },
    { id:85,  name:'Fruit Adept',            icon:'🍇',  category:'collect', hidden:false, description:'Collect 50 fruit types',              condition:'categoryCollect', conditionParam:{ category:'fruit',     count:50  } },
    { id:86,  name:'Fruit Master',           icon:'🍒',  category:'collect', hidden:true,  description:'Collect all 100 fruit types',         condition:'categoryCollect', conditionParam:{ category:'fruit',     count:100 } },
    { id:87,  name:'Grain Collector',        icon:'🌾',  category:'collect', hidden:false, description:'Collect 50 grain types',              condition:'categoryCollect', conditionParam:{ category:'grain',     count:50  } },
    { id:88,  name:'Herb Researcher',        icon:'💊',  category:'collect', hidden:false, description:'Collect 50 herb types',               condition:'categoryCollect', conditionParam:{ category:'medicine',  count:50  } },
    { id:89,  name:'Flower Connoisseur',     icon:'🌸',  category:'collect', hidden:false, description:'Collect 50 flower types',             condition:'categoryCollect', conditionParam:{ category:'flower',    count:50  } },
    { id:90,  name:'Tropical Explorer',      icon:'🥥',  category:'collect', hidden:false, description:'Collect 50 tropical crop types',      condition:'categoryCollect', conditionParam:{ category:'tropical',  count:50  } },
    { id:91,  name:'Mushroom Expert',        icon:'🍄',  category:'collect', hidden:false, description:'Collect 50 mushroom types',           condition:'categoryCollect', conditionParam:{ category:'mushroom',  count:50  } },
    { id:92,  name:'Spice Blender',          icon:'🌶️',  category:'collect', hidden:false, description:'Collect 50 spice types',              condition:'categoryCollect', conditionParam:{ category:'spice',     count:50  } },
    { id:93,  name:'Magic Apprentice',       icon:'✨',  category:'collect', hidden:false, description:'Collect 50 magic plant types',        condition:'categoryCollect', conditionParam:{ category:'magic',     count:50  } },
    { id:94,  name:'Legend Seeker',          icon:'🐉',  category:'collect', hidden:true,  description:'Collect 50 legendary crop types',     condition:'categoryCollect', conditionParam:{ category:'legend',    count:50  } },
    { id:95,  name:'Catalog Collector',      icon:'📖',  category:'collect', hidden:false, description:'Collect 100 different crops',         condition:'cropCollect',     conditionParam:100  },
    { id:96,  name:'Catalog Filler',         icon:'📕',  category:'collect', hidden:false, description:'Collect 500 different crops',         condition:'cropCollect',     conditionParam:500  },
    { id:97,  name:'Full Catalog Master',    icon:'📗',  category:'collect', hidden:true,  description:'Collect all 1000 crops',              condition:'cropCollect',     conditionParam:1000 },
    { id:98,  name:'First Product',          icon:'🍞',  category:'collect', hidden:false, description:'Craft 1 product type',                condition:'productCollect',  conditionParam:1    },
    { id:99,  name:'Product Collector',      icon:'🍰',  category:'collect', hidden:false, description:'Craft 10 product types',              condition:'productCollect',  conditionParam:10   },
    { id:100, name:'Product Master',         icon:'🧁',  category:'collect', hidden:false, description:'Craft 50 product types',              condition:'productCollect',  conditionParam:50   },
    { id:101, name:'King of Products',       icon:'🎂',  category:'collect', hidden:true,  description:'Craft 100 product types',             condition:'productCollect',  conditionParam:100  },
    { id:102, name:'First Skin',             icon:'🎨',  category:'collect', hidden:false, description:'Use 2 different skins',               condition:'skinUsed',        conditionParam:2    },
    { id:103, name:'Outfit Adept',           icon:'👗',  category:'collect', hidden:false, description:'Use 5 different skins',               condition:'skinUsed',        conditionParam:5    },
    { id:104, name:'Fashionable Farmer',     icon:'💃',  category:'collect', hidden:false, description:'Use 10 different skins',              condition:'skinUsed',        conditionParam:10   },
    { id:105, name:'Collector',              icon:'🏆',  category:'collect', hidden:true,  description:'Collect every skin',                  condition:'skinUsed',        conditionParam:50   },

    /* ========== VI. Days / Time 106-120 ========== */
    { id:106, name:'Novice Farmer',          icon:'📅',  category:'day',     hidden:false, description:'Survive 7 days',                          condition:'dayReached',   conditionParam:7      },
    { id:107, name:'Farm Owner',             icon:'🗓️',  category:'day',     hidden:false, description:'Survive 30 days',                         condition:'dayReached',   conditionParam:30     },
    { id:108, name:'Farm Veteran',           icon:'📆',  category:'day',     hidden:false, description:'Survive 100 days',                        condition:'dayReached',   conditionParam:100    },
    { id:109, name:'Farm Master',            icon:'🎯',  category:'day',     hidden:false, description:'Survive 365 days',                        condition:'dayReached',   conditionParam:365    },
    { id:110, name:'Four Seasons',           icon:'🍂',  category:'day',     hidden:false, description:'Experience all 4 seasons',                condition:'seasonSeen',   conditionParam:4      },
    { id:111, name:'Century Farm',           icon:'⏳',  category:'day',     hidden:true,  description:'Survive 1,000 days',                      condition:'dayReached',   conditionParam:1000   },
    { id:112, name:'First Merchant Visit',   icon:'🛎️',  category:'day',     hidden:false, description:'Trade with a merchant once',              condition:'merchantTrade', conditionParam:1     },
    { id:113, name:'Regular Customer',       icon:'🍵',  category:'day',     hidden:false, description:'Trade with a merchant 10 times',          condition:'merchantTrade', conditionParam:10    },
    { id:114, name:'Merchant Confidant',     icon:'🤝',  category:'day',     hidden:false, description:'Trade with a merchant 100 times',         condition:'merchantTrade', conditionParam:100   },
    { id:115, name:'Big Client',             icon:'💼',  category:'day',     hidden:true,  description:'Trade over 10,000 gold in one deal',      condition:'special:merchantBig', conditionParam:10000 },
    { id:116, name:'Met All Merchants',      icon:'👔',  category:'day',     hidden:false, description:'Trade with all 5 merchants',              condition:'special:allMerchants', conditionParam:5   },
    { id:117, name:'Lucky Day',              icon:'🍀',  category:'day',     hidden:false, description:'Trigger 10 positive events',              condition:'special:goodEvents',   conditionParam:10  },
    { id:118, name:'Bad Hair Day',           icon:'⛈️',  category:'day',     hidden:false, description:'Trigger 10 negative events',              condition:'special:badEvents',    conditionParam:10  },
    { id:119, name:'Weather Observer',       icon:'🌤️',  category:'day',     hidden:false, description:'Experience all weather types',            condition:'weatherSeen',          conditionParam:5   },
    { id:120, name:'Through Storm and Rain', icon:'🌧️',  category:'day',     hidden:true,  description:'Harvest 10 times in stormy weather',      condition:'special:stormHarvest', conditionParam:10  },

    /* ========== VII. Special 121-135 ========== */
    { id:121, name:'Amy\'s Favourite',       icon:'👩‍🌾', category:'special', hidden:false, description:'Trade with Amy',                    condition:'merchantTradeWith', conditionParam:'amy'    },
    { id:122, name:'Jack\'s Friend',         icon:'👨‍🌾', category:'special', hidden:false, description:'Trade with Jack',                   condition:'merchantTradeWith', conditionParam:'jack'   },
    { id:123, name:'Bobby\'s Partner',       icon:'🧔',  category:'special', hidden:false, description:'Trade with Bobby',                  condition:'merchantTradeWith', conditionParam:'bobby'  },
    { id:124, name:'Old Wang\'s VIP',        icon:'👴',  category:'special', hidden:false, description:'Trade with Old Wang',               condition:'merchantTradeWith', conditionParam:'laowang'},
    { id:125, name:'Xiaoxin\'s Customer',    icon:'🧒',  category:'special', hidden:false, description:'Trade with Xiaoxin',                condition:'merchantTradeWith', conditionParam:'xiaoxin'},
    { id:126, name:'Harvest Moment',         icon:'🎊',  category:'special', hidden:true,  description:'Harvest 100 crops in one day',      condition:'special:harvest100in1day', conditionParam:100 },
    { id:127, name:'Combo Master',           icon:'🔥',  category:'special', hidden:true,  description:'Harvest 10 times in a row',         condition:'special:harvestStreak10',  conditionParam:10  },
    { id:128, name:'Fifty at Once',          icon:'💦',  category:'special', hidden:true,  description:'Water 50 plots at once',            condition:'special:water50',    conditionParam:50  },
    { id:129, name:'Shopping Spree',         icon:'💎',  category:'special', hidden:true,  description:'Spend over 10,000 gold in one purchase', condition:'special:mallBig', conditionParam:10000 },
    { id:130, name:'Out of Seeds',           icon:'🫙',  category:'special', hidden:true,  description:'Have zero seeds in storage',        condition:'special:noSeeds',    conditionParam:0   },
    { id:131, name:'Zero Gold',              icon:'🚫',  category:'special', hidden:true,  description:'Gold reaches zero',                 condition:'special:zeroGold',   conditionParam:0   },
    { id:132, name:'Storage Critical',       icon:'📦',  category:'special', hidden:false, description:'Storage reaches full capacity',     condition:'special:storageFull', conditionParam:0  },
    { id:133, name:'Big Move',               icon:'🌟',  category:'special', hidden:false, description:'Use legendary fertilizer',          condition:'special:useLegendaryFertilizer', conditionParam:1 },
    { id:134, name:'Spellcaster',            icon:'🧪',  category:'special', hidden:true,  description:'Use 5 different fertilizers',       condition:'special:allFertilizers', conditionParam:5 },
    { id:135, name:'Max Level',              icon:'👑',  category:'special', hidden:true,  description:'Reach the current version\'s max level', condition:'levelReached', conditionParam:500 },

    /* ========== VIII. Hidden 136-150 ========== */
    { id:136, name:'Walking with Dragons',   icon:'🐉',  category:'hidden',  hidden:true,  description:'Harvest 100 legendary crops',             condition:'categoryHarvest', conditionParam:{ category:'legend', count:100 } },
    { id:137, name:'Lazy Day',               icon:'😴',  category:'hidden',  hidden:true,  description:'Log in but never plant all day',          condition:'special:lazyDay',   conditionParam:1  },
    { id:138, name:'Night Owl Farmer',       icon:'🌙',  category:'hidden',  hidden:true,  description:'Play between 3 and 5 AM',                 condition:'special:nightOwl',  conditionParam:1  },
    { id:139, name:'Early Bird',             icon:'🌅',  category:'hidden',  hidden:true,  description:'Farm between 5 and 7 AM',                 condition:'special:earlyBird', conditionParam:1  },
    { id:140, name:'Vegetarian',             icon:'🥬',  category:'hidden',  hidden:true,  description:'Harvest 500 vegetables in total',         condition:'categoryHarvest',   conditionParam:{ category:'vegetable', count:500 } },
    { id:141, name:'Fruit Fanatic',          icon:'🍎',  category:'hidden',  hidden:true,  description:'Harvest 500 fruits in total',             condition:'categoryHarvest',   conditionParam:{ category:'fruit',     count:500 } },
    { id:142, name:'Herb Farmer',            icon:'💊',  category:'hidden',  hidden:true,  description:'Harvest 500 herbs in total',              condition:'categoryHarvest',   conditionParam:{ category:'medicine',  count:500 } },
    { id:143, name:'Garden Keeper',          icon:'🌸',  category:'hidden',  hidden:true,  description:'Harvest 500 flowers in total',            condition:'categoryHarvest',   conditionParam:{ category:'flower',    count:500 } },
    { id:144, name:'Folk Doctor',            icon:'🩺',  category:'hidden',  hidden:true,  description:'Use plant doctor 10 times',               condition:'special:usePlantDoctor', conditionParam:10 },
    { id:145, name:'Destroyer',              icon:'💥',  category:'hidden',  hidden:true,  description:'Dig up 50 crops',                         condition:'special:digCrops',       conditionParam:50 },
    { id:146, name:'Philanthropist',         icon:'🎗️',  category:'hidden',  hidden:true,  description:'Lose 10,000 gold in total',               condition:'special:lostGold',       conditionParam:10000 },
    { id:147, name:'On the Brink',           icon:'💔',  category:'hidden',  hidden:true,  description:'Gold below 10',                           condition:'special:lowGold',        conditionParam:10 },
    { id:148, name:'So Close',               icon:'🎯',  category:'hidden',  hidden:true,  description:'Exactly 1 EXP short of leveling up',     condition:'special:almostLevel',    conditionParam:1  },
    { id:149, name:'All-Category Collector', icon:'🗃️',  category:'hidden',  hidden:true,  description:'Own crops from every category',           condition:'special:allCategories',  conditionParam:10 },
    { id:150, name:'Perfectionist',          icon:'🌟',  category:'hidden',  hidden:true,  description:'Complete every non-hidden achievement',   condition:'special:allNonHidden',   conditionParam:135 },
];

/* ============================================================
   Query helpers
   ============================================================ */

/**
 * Get achievement by id
 */
function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id) || null;
}

/**
 * Get all non-hidden achievements
 */
function getVisibleAchievements() {
    return ACHIEVEMENTS.filter(a => !a.hidden);
}

/**
 * Get all hidden achievements
 */
function getHiddenAchievements() {
    return ACHIEVEMENTS.filter(a => a.hidden);
}

/**
 * Get achievements in a category
 */
function getAchievementsByCategory(category) {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * Count achievements per category
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