const mineflayer = require("mineflayer");
const readline = require("readline");
const autoeat = require('mineflayer-auto-eat').plugin
const fs = require("fs");
const inventoryViewer = require('mineflayer-web-inventory');
const crafter = require("mineflayer-crafting-util").plugin
const getIron = require('./func/getIron')
const shopItem = require('./func/shopItem')
const placeIronOre = require('./func/placeOre')
const mineIronOre = require('./func/mineOre')
const throwRawIronBlock = require('./func/throwIron')
const throwTrash = require('./func/throwTrash')
const portfinder = require('portfinder');
const Logger = require('./utils/logger')

let config = JSON.parse(fs.readFileSync("config.json"), 'utf8');

let bot;

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const botArgs = {
    host: config.bot_args.host,
    port: config.bot_args.port,
    username: config.bot_args.username,
    version: '1.20.1',
    auth: 'microsoft',
    keepAlive: true,
    checkTimeoutInterval: 60 * 1000
};

async function change_status(status) {
    let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))
    cache.status = status
    fs.writeFileSync(`${process.cwd()}/cache.json`, JSON.stringify(cache))
    Logger.log('[\x1b[34mM\x1b[0mAIN] 目前狀態:' + status)
}

async function checkPickaxe(bot) {
    try {
        await bot.equip(804, 'hand')
    } catch (e) {
        Logger.error(`[\x1b[34mM\x1b[0mAIN] 發生錯誤: ${e}`)
        return
    }

    let heldItem = bot.heldItem;

    if (heldItem) {
        Logger.log(`[\x1b[34mM\x1b[0mAIN] 手上工具耐久度: ${(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()} / ${heldItem.maxDurability}`); // durability of held item
    } else {
        Logger.error(`[\x1b[34mM\x1b[0mAIN] 手上沒有任何物品`);
        return
    }

    if ((Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()) <= 200) {
        bot.chat(config.exp_warp)
        await new Promise(r => setTimeout(r, 3000));
        let now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
        const fix_pickaxe = new Promise(async (resolve, reject) => {
            while (now_durability < heldItem.maxDurability) {
                heldItem = bot.heldItem;
                await new Promise(r => setTimeout(r, 1000));
                now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
                Logger.log('[\x1b[34mM\x1b[0mAIN] 修復鎬子中，目前耐久度: ' + now_durability)
            }

            resolve('fixed')
        })

        const timeoutpromise = new Promise((resolve, reject) => {
            timeout = setTimeout(() => {
                resolve('timeout')
            }, 30000)
        })

        await Promise.race([fix_pickaxe, timeoutpromise])

        await bot.chat(config.mine_warp)
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function startProcess(bot, previousStatus=undefined) {
    let ironCount = bot.inventory.items().filter(item => item.name === 'raw_iron_block').reduce((sum, item) => sum + item.count, 0);
    let minedCount = 0
    
    switch (previousStatus) {
        case 'get_iron_ore':
            await getIron(bot)
            await throwTrash(bot)
            await bot.chat(config.mine_warp)
            await change_status('shop_item')
            await shopItem(bot)

            ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
            await change_status('place_and_dig')
            try {
                await bot.closeWindow(bot.currentWindow)
            } catch (e) {}
            Logger.log(`[\x1b[34mM\x1b[0mAIN] 鐵原礦方塊數量: ${ironCount}`)
            for (let i=0; i<ironCount/25; i++) {
                await placeIronOre(bot)
                minedCount += await mineIronOre(bot)
                ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
                await checkPickaxe(bot)
            }

            await change_status('throw_raw_iron_block')
            await throwRawIronBlock(bot)
            break
        case 'shop_item':
            await bot.chat(config.mine_warp)
            await change_status('shop_item')
            await shopItem(bot)

            ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
            await change_status('place_and_dig')
            try {
                await bot.closeWindow(bot.currentWindow)
            } catch (e) {}
            Logger.log(`[\x1b[34mM\x1b[0mAIN] 鐵原礦方塊數量: ${ironCount}`)
            for (let i=0; i<ironCount/25; i++) {
                await placeIronOre(bot)
                minedCount += await mineIronOre(bot)
                ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
                await checkPickaxe(bot)
            }
            await change_status('throw_raw_iron_block')
            await throwRawIronBlock(bot)
            break
        case 'place_and_dig':
            ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
            await change_status('place_and_dig')
            try {
                await bot.closeWindow(bot.currentWindow)
            } catch (e) {}
            Logger.log(`[\x1b[34mM\x1b[0mAIN] 鐵原礦方塊數量: ${ironCount}`)
            for (let i=0; i<ironCount/25; i++) {
                await placeIronOre(bot)
                minedCount += await mineIronOre(bot)
                ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
                await checkPickaxe(bot)
            }
            await change_status('throw_raw_iron_block')
            await throwRawIronBlock(bot)
            break
        case 'throw_raw_iron_block':
            await throwRawIronBlock(bot)
            break

        default:
            break
    }

    await new Promise(r => setTimeout(r, 2000))

    await change_status('get_iron_ore')
    await getIron(bot)
    await throwTrash(bot)
    await bot.chat(config.mine_warp)
    await change_status('shop_item')
    await shopItem(bot)

    ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
    await change_status('place_and_dig')
    try {
        await bot.closeWindow(bot.currentWindow)
    } catch (e) {}
    Logger.log(`[\x1b[34mM\x1b[0mAIN] 鐵原礦方塊數量: ${ironCount}`)

    async function placeDigIronProcess() {
        for (let i=0; i<ironCount/25; i++) {
            await placeIronOre(bot)
            minedCount += await mineIronOre(bot)
            ironCount = bot.inventory.items().filter(item => item.name === 'iron_ore').reduce((sum, item) => sum + item.count, 0);
            await checkPickaxe(bot)
        }

        if (ironCount/25 > 0) {
            await placeDigIronProcess()
        }
    }

    await placeDigIronProcess()

    await change_status('throw_raw_iron_block')
    await throwRawIronBlock(bot)

    return minedCount
}

const initBot = async () => {
    bot = mineflayer.createBot(botArgs);
    bot.loadPlugin(autoeat)
    bot.loadPlugin(crafter)
    
    let port = await portfinder.getPortPromise({
        startPort: 7000,
        stopPort: 65535
    }).catch((error) => {
        Logger.error(`[\x1b[34mM\x1b[0mAIN] 無法找到可用的端口`);
        throw error;
    });
    
    Logger.log(`[\x1b[34mM\x1b[0mAIN] 已找到可用的端口 ${port}`);

    let options = {
        port: port
    }

    Logger.log(`[\x1b[34mM\x1b[0mAIN] 正在啟動機器人...`);
    inventoryViewer(bot, options)
    
    bot.once("login", () => {
        let botSocket = bot._client.socket;
        Logger.log(`[\x1b[34mM\x1b[0mAIN] 已成功登入 ${botSocket.server ? botSocket.server : botSocket._host}`);
    });

    bot.once("spawn", async () => {
        bot.chat('bot is online')
        Logger.log(`[\x1b[34mM\x1b[0mAIN] 地圖已載入`);

        config = JSON.parse(fs.readFileSync("config.json"), 'utf8');
        let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))

        rl.on("line", function (line) {
            bot.chat(line)
        });

        await new Promise(r => setTimeout(r, 5000))
        await bot.chat(config.mine_warp)
        await new Promise(r => setTimeout(r, 5000))
        await bot.chat(`/sethome mine`)
        await startProcess(bot, cache.status)

        while (true) {
            let mined_count = await startProcess(bot)
            await bot.chat(config.mine_warp)

            cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))
            cache.iron_ore_mined += mined_count
            fs.writeFileSync(`${process.cwd()}/cache.json`, JSON.stringify(cache))

            Logger.log('[\x1b[34mM\x1b[0mAIN] 已完成一次循環')
        }   
    });

    bot.on('windowClose', (window) => {
        console.log('window closed', window?.title || 'unknown')
    })

    bot.on('windowOpen', (window) => {
        console.log('window opened', window?.title || 'unknown')
    })

    bot.on("message", (jsonMsg) => {
        var regex = /Summoned to server(\d+) by Logger/;
        if (regex.exec(jsonMsg.toString())) {
            bot.chat(config.server)
            bot.chat(config.warp)
        }

        let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))

        if (jsonMsg.toString().startsWith('[領地] 您沒有')) {
            Logger.error(`[\x1b[34mM\x1b[0mAIN] 您沒有該領地的權限`)
        }

        if (/^\[([A-Za-z0-9_]+) -> 您\] .*/.exec(jsonMsg.toString())) {
            const msg = jsonMsg.toString()
            const pattern = /^\[([A-Za-z0-9_]+) -> 您\] .*/;
            const match = pattern.exec(msg);
            if (match) {
                let playerid = match[1];
                if (playerid === bot.username) {return};
                let args = msg.slice(8 + playerid.length);
                const commandName = args.split(' ')[0].toLowerCase();

                switch (commandName) {
                    case 'count':
                        bot.chat(`/m ${playerid} 我已挖取 ${cache.iron_ore_mined} 個鐵原礦`)
                        break
                    default:
                        bot.chat(`/m ${playerid} 此為 Jimmy 開發的 [廢土鐵原礦機器人] ，如有疑問請私訊 Discord: jimmy.young`)
                        break
                }
            }
        }

        if (jsonMsg.toString().includes('目標生命 : ')) return

        Logger.log(jsonMsg.toAnsi());
    });

    bot.on("end", () => {
        Logger.log(`[\x1b[34mM\x1b[0mAIN] 機器人已斷線，將於 5 秒後重啟`);
        for (listener of rl.listeners('line')) {
            rl.removeListener('line', listener)
        }
        
        setTimeout(process.exit(246), 5000);
    });

    bot.on("kicked", (reason) => {
        Logger.warn(`[\x1b[34mM\x1b[0mAIN] 機器人被伺服器踢出，原因：${reason}`);
        process.exit(246)
    });

    bot.on('death', () => {
        Logger.warn(`[\x1b[34mM\x1b[0mAIN] 機器人死亡了`);
        bot.respawn()
    })

    bot.on("error", (err) => {
        if (err.code === "ECONNREFUSED") {
            Logger.error(`[\x1b[34mM\x1b[0mAIN] 連線到 ${err.address}:${err.port} 時失敗`);
        } else {
            Logger.error(`[\x1b[34mM\x1b[0mAIN] 發生無法預期的錯誤: ${err}`);
        }

        process.exit(1);
    });
};

initBot();

process.on("unhandledRejection", async (error) => {
    Logger.log(error)
    Logger.error('[\x1b[34mM\x1b[0mAIN] ' + error.message)
    process.exit(1)
});

process.on("uncaughtException", async (error) => {
    Logger.log(error)
    Logger.error('[\x1b[34mM\x1b[0mAIN] ' + error.message)
    process.exit(1)
});

process.on("uncaughtExceptionMonitor", async (error) => {
    Logger.log(error)
    Logger.error('[\x1b[34mM\x1b[0mAIN] ' + error.message)
    process.exit(1)
});