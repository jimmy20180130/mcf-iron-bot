const mineflayer = require('mineflayer');
const readline = require('readline');
const autoeat = require('mineflayer-auto-eat').plugin;
const fs = require('fs').promises;
const Vec3 = require('vec3').Vec3;
const inventoryViewer = require('mineflayer-web-inventory');
const crafter = require('mineflayer-crafting-util').plugin;
const { get_iron_ore, shop_item, place_iron_ore, mine_iron_ore, throw_raw_iron_block, throw_trash } = require('./iron.js');

// 加載配置文件
const config = require('./config.json');

let bot;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * 更新機器人狀態
 * @param {mineflayer.Bot} bot 
 * @param {string} status 
 */
async function changeStatus(bot, status) {
    try {
        const cache = JSON.parse(await fs.readFile(`${process.cwd()}/cache.json`, 'utf8'));
        cache.status = status;
        await fs.writeFile(`${process.cwd()}/cache.json`, JSON.stringify(cache));
        console.log(`[INFO] 目前狀態: ${status}`);
    } catch (error) {
        console.error('[ERROR] 更新狀態失敗:', error);
    }
}

/**
 * 初始化並啟動機器人
 */
async function initBot() {
    bot = mineflayer.createBot(config.bot_args);
    bot.loadPlugin(autoeat);
    bot.loadPlugin(crafter);

    const options = { port: 40241 };
    console.log('[INFO] 正在啟動機器人...');
    inventoryViewer(bot, options);

    bot.once('login', handleLogin);
    bot.once('spawn', handleSpawn);
    bot.on('message', handleMessage);
    bot.on('end', handleDisconnect);
    bot.on('kicked', handleKick);
    bot.on('error', handleError);
}

function handleLogin() {
    const botSocket = bot._client.socket;
    console.log(`[INFO] 已成功登入 ${botSocket.server || botSocket._host}`);
}

async function handleSpawn() {
    bot.chat('bot is online');
    console.log('[INFO] 地圖已載入');

    rl.on('line', (line) => bot.chat(line));

    await bot.chat(config.mine_warp);
    await new Promise(r => setTimeout(r, 5000));
    await bot.chat(`/sethome mine`);
    await new Promise(r => setTimeout(r, 10000));

    const cache = JSON.parse(await fs.readFile(`${process.cwd()}/cache.json`, 'utf8'));
    await handleStatus(cache.status);

    while (true) {
        await runMiningCycle();
    }
}

async function handleStatus(status) {
    switch (status) {
        case 'get_iron_ore':
            break;
        case 'shop_item':
            await handleShopItem();
            break;
        case 'place_and_dig':
            await handlePlaceAndDig();
            break;
        case 'throw_raw_iron_block':
            await handleThrowRawIronBlock();
            break;
        default:
            await bot.chat(config.mine_warp);
            await new Promise(r => setTimeout(r, 1000));
    }
}

async function handleShopItem() {
    await bot.chat(config.mine_warp);
    await new Promise(r => setTimeout(r, 1000));
    await changeStatus(bot, 'shop_item');
    await shop_item(bot);
    await handlePlaceAndDig();
}

async function handlePlaceAndDig() {
    await changeStatus(bot, 'place_and_dig');
    await bot.chat(`/homes mine`);

    const ironOreCount = bot.inventory.items().reduce((count, item) => 
        item.name === 'iron_ore' ? count + item.count : count, 0);

    for (let i = 0; i < ironOreCount; i++) {
        await place_iron_ore(bot);
        await mine_iron_ore(bot);
        await checkAndRepairTool();
        await new Promise(r => setTimeout(r, 100));
    }

    await handleThrowRawIronBlock();
}

async function handleThrowRawIronBlock() {
    await changeStatus(bot, 'throw_raw_iron_block');
    await throw_raw_iron_block(bot);
    await new Promise(r => setTimeout(r, 100));
}

async function checkAndRepairTool() {
    const heldItem = bot.heldItem;
    if (heldItem && heldItem.name === 'netherite_pickaxe') {
        const durability = heldItem.maxDurability - heldItem.durabilityUsed;
        console.log(`手上工具耐久度: ${durability.toFixed()} / ${heldItem.maxDurability}`);

        if (durability <= 200) {
            await repairTool();
        }
    }
}

async function repairTool() {
    bot.chat(config.exp_warp);
    await new Promise(r => setTimeout(r, 1000));

    const heldItem = bot.heldItem;
    let nowDurability = heldItem.maxDurability - heldItem.durabilityUsed;

    const fixPickaxe = new Promise(async (resolve) => {
        while (nowDurability < heldItem.maxDurability) {
            await new Promise(r => setTimeout(r, 1000));
            nowDurability = heldItem.maxDurability - heldItem.durabilityUsed;
            console.log(nowDurability);
        }
        resolve('fixed');
    });

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 30000);
    });

    await Promise.race([fixPickaxe, timeoutPromise]);

    bot.chat(config.trash_warp);
    await throw_trash(bot);
    bot.chat(config.mine_warp);
    await new Promise(r => setTimeout(r, 1000));
}

async function runMiningCycle() {
    console.log('starting_process');
    await changeStatus(bot, 'get_iron_ore');

    await get_iron_ore(bot);

    while (!bot.inventory.items().find(item => item.name === 'iron_ingot')) {
        await get_iron_ore(bot);
        if (bot.inventory.items().find(item => item.name === 'iron_ingot')) break;
        bot.chat(config.mine_warp);
        console.log('waiting for iron_ingot');
        await new Promise(r => setTimeout(r, 2000));
    }

    await changeStatus(bot, 'shop_item');
    await shop_item(bot);

    await handlePlaceAndDig();

    console.log('finished_process');
    await new Promise(r => setTimeout(r, 1000));
}

function handleMessage(jsonMsg) {
    console.log(jsonMsg.toAnsi());

    const summonedRegex = /Summoned to server(\d+) by CONSOLE/;
    if (summonedRegex.test(jsonMsg.toString())) {
        bot.chat(config.server);
        bot.chat(config.warp);
    }

    if (jsonMsg.toString().startsWith('[領地] 您沒有')) {
        process.exit(1);
    }

    const privateMessageRegex = /^\[([A-Za-z0-9_]+) -> 您\] .*/;
    const match = privateMessageRegex.exec(jsonMsg.toString());
    if (match) {
        handlePrivateMessage(match[1], jsonMsg.toString().slice(8 + match[1].length));
    }
}

async function handlePrivateMessage(playerid, message) {
    if (playerid === bot.username) return;
    const commandName = message.split(' ')[0].toLowerCase();

    switch (commandName) {
        case 'iron_mined':
            const cache = JSON.parse(await fs.readFile(`${process.cwd()}/cache.json`, 'utf8'));
            bot.chat(`/m ${playerid} 鐵礦挖掘數量: ${cache.iron_ore_mined}`);
            break;
        default:
            bot.chat(`/m ${playerid} 此為 Jimmy 開發的 [廢土鐵原礦機器人] ，如有疑問請私訊 Discord: xiaoxi_tw`);
            break;
    }
}

function handleDisconnect() {
    console.log('[INFO] 機器人已斷線，將於 5 秒後重啟');
    rl.removeAllListeners('line');
    setTimeout(initBot, 5000);
}

function handleKick(reason) {
    console.log(`[WARN] 機器人被伺服器踢出\n原因：${reason}`);
}

function handleError(err) {
    if (err.code === 'ECONNREFUSED') {
        console.log(`[ERROR] 連線到 ${err.address}:${err.port} 時失敗`);
    } else {
        console.log(`[ERROR] 發生無法預期的錯誤: ${err}`);
    }
    process.exit(1);
}

initBot();

process.on('unhandledRejection', (error) => {
    console.log('[ERROR] Unhandled Rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.log('[ERROR] Uncaught Exception:', error);
    process.exit(1);
});

process.on('uncaughtExceptionMonitor', (error) => {
    console.log('[ERROR] Uncaught Exception (Monitor):', error);
    process.exit(1);
});