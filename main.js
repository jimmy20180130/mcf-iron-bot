const mineflayer = require("mineflayer");
const readline = require("readline");
const autoeat = require('mineflayer-auto-eat').plugin
const fs = require("fs");
const Vec3 = require('vec3')
const inventoryViewer = require('mineflayer-web-inventory');
const crafter = require("mineflayer-crafting-util").plugin
const { get_iron_ore, shop_item, place_iron_ore, mine_iron_ore, throw_raw_iron_block } = require(`./iron.js`)

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
    version: config.bot_args.version,
    auth: config.bot_args.auth,
    keepAlive: true,
    checkTimeoutInterval: 60 * 1000
};

function change_status(bot, status) {
    let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))
    cache.status = status
    fs.writeFileSync(`${process.cwd()}/cache.json`, JSON.stringify(cache))
    console.log('[INFO] 目前狀態:' + status)
}

const initBot = () => {
    bot = mineflayer.createBot(botArgs);
    bot.loadPlugin(autoeat)
    bot.loadPlugin(crafter)
    let options = {
        port: 40241
    }
    console.log('[INFO] ' + `正在啟動機器人...`);
    inventoryViewer(bot, options)
    
    bot.once("login", () => {
        let botSocket = bot._client.socket;
        console.log('[INFO] ' + `已成功登入 ${botSocket.server ? botSocket.server : botSocket._host}`);
    });

    bot.once("spawn", async () => {
        bot.chat('bot is online')
        console.log('[INFO] ' + `地圖已載入`);

        config = JSON.parse(fs.readFileSync("config.json"), 'utf8');

        rl.on("line", function (line) {
            bot.chat(line)
        });

        await new Promise(r => setTimeout(r, 5000))

        await bot.chat(config.mine_warp)

        await new Promise(r => setTimeout(r, 5000))

        await bot.chat(`/sethome mine`)

        await new Promise(r => setTimeout(r, 10000))

        let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))
        let iron_ore_count = 0

        switch (cache.status) {
            case 'get_iron_ore':
                break
            case 'shop_item':
                await bot.chat(config.mine_warp)
                await new Promise(r => setTimeout(r, 1000))

                change_status(bot, 'shop_item')
                await shop_item(bot)

                for (const item of bot.inventory.items()) {
                    if (item.name == 'iron_ore') {
                        iron_ore_count += item.count
                    }
                }
                
                change_status(bot, 'place_and_dig')
                await bot.chat(`/homes mine`)

                for (let i=0; i< iron_ore_count; i++) {
                    let iron_countt = 0
                    for (const item of bot.inventory.items()) {
                        if (item.name == 'iron_ore') {
                            iron_countt += item.count
                        }
                    }

                    iron_ore_count = iron_countt

                    console.log('place_iron_ore')
                    await place_iron_ore(bot)
                    console.log('mine_iron_ore')
                    await mine_iron_ore(bot)

                    let heldItem = bot.heldItem;

                    if (heldItem) {
                        console.log(`手上工具耐久度: ${(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()} / ${heldItem.maxDurability}`); // durability of held item
                    }

                    if ((Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()) <= 200) {
                        bot.chat(config.exp_warp)
                        await new Promise(r => setTimeout(r, 1000));
                        let now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
                        const fix_pickaxe = new Promise(async (resolve, reject) => {
                            while (now_durability < heldItem.maxDurability) {
                                heldItem = bot.heldItem;
                                await new Promise(r => setTimeout(r, 1000));
                                now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
                                console.log(now_durability)
                            }

                            resolve('fixed')
                        })

                        const timeoutpromise = new Promise((resolve, reject) => {
                            timeout = setTimeout(() => {
                                resolve('timeout')
                            }, 30000)
                        })

                        await Promise.race([fix_pickaxe, timeoutpromise])

                        bot.chat(config.mine_warp)
                        await new Promise(r => setTimeout(r, 1000))
                    }

                    await new Promise(r => setTimeout(r, 100))
                }

                change_status(bot, 'throw_raw_iron_block')
                await throw_raw_iron_block(bot)

                await new Promise(r => setTimeout(r, 100))
                break
            case 'place_and_dig':
                await bot.chat(config.mine_warp)
                await new Promise(r => setTimeout(r, 1000))

                change_status(bot, 'place_and_dig')

                await bot.chat(`/homes mine`)

                for (const item of bot.inventory.items()) {
                    if (item.name == 'iron_ore') {
                        iron_ore_count += item.count
                    }
                }

                console.log(iron_ore_count)

                for (let i=0; i< iron_ore_count; i++) {
                    let iron_countt = 0
                    for (const item of bot.inventory.items()) {
                        if (item.name == 'iron_ore') {
                            iron_countt += item.count
                        }
                    }

                    iron_ore_count = iron_countt

                    console.log('place_iron_ore')
                    await place_iron_ore(bot)
                    console.log('mine_iron_ore')
                    await mine_iron_ore(bot)

                    let heldItem = bot.heldItem;

                    if (heldItem) {
                        console.log(`手上工具耐久度: ${(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()} / ${heldItem.maxDurability}`); // durability of held item
                    }

                    if ((Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()) <= 200) {
                        bot.chat(config.exp_warp)
                        await new Promise(r => setTimeout(r, 1000));
                        let now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())

                        const fix_pickaxe = new Promise(async (resolve, reject) => {
                            while (now_durability < heldItem.maxDurability) {
                                heldItem = bot.heldItem;
                                await new Promise(r => setTimeout(r, 1000));
                                now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
                                console.log(now_durability)
                            }

                            resolve('fixed')
                        })

                        const timeoutpromise = new Promise((resolve, reject) => {
                            timeout = setTimeout(() => {
                                resolve('timeout')
                            }, 30000)
                        })

                        await Promise.race([fix_pickaxe, timeoutpromise])

                        bot.chat(config.mine_warp)
                        await new Promise(r => setTimeout(r, 1000))
                    }

                    await new Promise(r => setTimeout(r, 100))
                }

                change_status(bot, 'throw_raw_iron_block')
                await throw_raw_iron_block(bot)

                await new Promise(r => setTimeout(r, 100))
                break
            
            case 'throw_raw_iron_block':
                await bot.chat(config.mine_warp)
                await new Promise(r => setTimeout(r, 1000))

                change_status(bot, 'throw_raw_iron_block')

                await throw_raw_iron_block(bot)
                break

            default:
                await bot.chat(config.mine_warp)
                await new Promise(r => setTimeout(r, 1000))
        }

        await bot.chat(config.mine_warp)
        await new Promise(r => setTimeout(r, 1000))

        while (true) {
            config = JSON.parse(fs.readFileSync("config.json"), 'utf8');

            console.log('starting_process')
            change_status(bot, 'get_iron_ore')

            await get_iron_ore(bot)

            while (!bot.inventory.items().find(item => item.name === 'iron_ingot')) {
                await get_iron_ore(bot)

                if (bot.inventory.items().find(item => item.name === 'iron_ingot')) {
                    break
                } else {
                    bot.chat(config.mine_warp)
                    console.log('waiting for iron_ingot')
                    await new Promise(r => setTimeout(r, 2000))
                }
            }
            

            change_status(bot, 'shop_item')
            await shop_item(bot)

            let iron_ore_count = 0

            for (const item of bot.inventory.items()) {
                if (item.name == 'iron_ore') {
                    iron_ore_count += item.count
                }
            }
            
            change_status(bot, 'place_and_dig')
            await bot.chat(`/homes mine`)

            for (let i=0; i < iron_ore_count; i++) {
                let iron_countt = 0
                for (const item of bot.inventory.items()) {
                    if (item.name == 'iron_ore') {
                        iron_countt += item.count
                    }
                }

                iron_ore_count = iron_countt

                console.log('place_iron_ore')
                await place_iron_ore(bot)
                console.log('mine_iron_ore')
                await mine_iron_ore(bot)

                let heldItem = bot.heldItem;
                
                if (heldItem) {
                    console.log(`手上工具耐久度: ${(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()} / ${heldItem.maxDurability}`); // durability of held item
                }

                if ((Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed()) <= 200) {
                    bot.chat(config.exp_warp)
                    await new Promise(r => setTimeout(r, 1000));
                    let now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())

                    const fix_pickaxe = new Promise(async (resolve, reject) => {
                        while (now_durability < heldItem.maxDurability) {
                            heldItem = bot.heldItem;
                            await new Promise(r => setTimeout(r, 1000));
                            now_durability = (Number(heldItem.maxDurability-heldItem.durabilityUsed).toFixed())
                            console.log(now_durability)
                        }

                        resolve('fixed')
                    })

                    const timeoutpromise = new Promise((resolve, reject) => {
                        timeout = setTimeout(() => {
                            resolve('timeout')
                        }, 30000)
                    })

                    await Promise.race([fix_pickaxe, timeoutpromise])

                    bot.chat(config.mine_warp)
                    await new Promise(r => setTimeout(r, 1000))
                }

                await new Promise(r => setTimeout(r, 100))
            }

            change_status(bot, 'throw_raw_iron_block')
            await throw_raw_iron_block(bot)

            console.log('finished_process')
            await new Promise(r => setTimeout(r, 1000))
        }
    });

    bot.on("message", (jsonMsg) => {
        var regex = /Summoned to server(\d+) by CONSOLE/;
        if (regex.exec(jsonMsg.toString())) {
            bot.chat(config.server)
            bot.chat(config.warp)
        }

        let cache = JSON.parse(fs.readFileSync(`${process.cwd()}/cache.json`, 'utf8'))

        if (jsonMsg.toString().startsWith('[領地] 您沒有')) {
            process.exit(1)
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
                    case 'iron_mined':
                        bot.chat(`/m ${playerid} 鐵礦挖掘數量: ${cache.iron_ore_mined}`)
                        break
                    default:
                        bot.chat(`/m ${playerid} 此為 Jimmy 開發的 [廢土鐵原礦機器人] ，如有疑問請私訊 Discord: xiaoxi_tw`)
                        break
                }
            }
        }

        if (jsonMsg.toString().includes('目標生命 : ')) return

        console.log(jsonMsg.toAnsi());
    });

    bot.on("end", () => {
        console.log('[INFO] ' + `機器人已斷線，將於 5 秒後重啟`);
        for (listener of rl.listeners('line')) {
            rl.removeListener('line', listener)
        }
        
        setTimeout(initBot, 5000);
    });

    bot.on("kicked", (reason) => {
        console.log('[WARN] ' + `機器人被伺服器踢出\n原因：${reason}`);
    });

    bot.on("error", (err) => {
        if (err.code === "ECONNREFUSED") {
            console.log('[ERROR] ' + `連線到 ${err.address}:${err.port} 時失敗`);
        } else {
            console.log('[ERROR] ' + `發生無法預期的錯誤: ${err}`);
        }

        process.exit(1);
    });
};

initBot();

process.on("unhandledRejection", async (error) => {
    console.log(error)
    console.log('[ERROR] ' + error.message)
    process.exit(1)
});

process.on("uncaughtException", async (error) => {
    console.log(error)
    console.log('[ERROR] ' + error.message)
    process.exit(1)
});

process.on("uncaughtExceptionMonitor", async (error) => {
    console.log(error)
    console.log('[ERROR] ' + error.message)
    process.exit(1)
});