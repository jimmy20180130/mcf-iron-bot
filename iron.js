const Vec3 = require('vec3').Vec3;
const fs = require('fs').promises;
const config = require('./config.json');

/**
 * get iron_ore from shulker_box
 * @param {import('mineflayer').Bot} bot 
 */
async function get_iron_ore(bot) {
    try {
        const shulkerBox = await findShulkerBox(bot);
        if (!shulkerBox) {
            console.log('shulker_box not found');
            return;
        }

        console.log(`shulker_box found: ${shulkerBox.position}`);

        const shulkerBoxWindow = await openShulkerBox(bot, shulkerBox);
        if (!shulkerBoxWindow) return;

        await withdrawAllItems(bot, shulkerBoxWindow);
        shulkerBoxWindow.close();
        console.log('finished_getting_iron');
    } catch (error) {
        //console.error('Error in get_iron_ore:', error);
    }
}

/**
 * exchange items
 * @param {import('mineflayer').Bot} bot 
 */
async function shop_item(bot) {
    try {
        await new Promise(r => setTimeout(r, 3000));

        const ironIngotCount = countInventoryItem(bot, 'iron_ingot');
        const shopWindow = await openShopWindow(bot);

        for (let i = 0; i < Math.floor(ironIngotCount / 64); i++) {
            if (shopWindow) {
                await bot.simpleClick.leftMouse(1);
                console.log('成功兌換鐵錠至鐵原礦');
            } else {
                await openShopWindow(bot);
                i--;
            }

            await new Promise(r => setTimeout(r, i % 5 !== 0 ? 500 : 3000));
        }

        try {
            await bot.closeWindow(shopWindow);
        } catch (e) {
            //console.error('關閉商店窗口時發生錯誤:', e);
        }
    } catch (error) {
        //console.error('Error in shop_item:', error);
    }
}

/**
 * place blocks
 * @param {import('mineflayer').Bot} bot 
 */
async function place_iron_ore(bot) {
    try {
        const ironOre = bot.inventory.items().find(item => item.name === 'iron_ore');
        if (!ironOre) return;

        await bot.equip(51, 'hand');
        console.log('equipped iron_ore');

        const surroundingCoords = await getSurroundingBlockCoords(bot);

        for (const coord of surroundingCoords) {
            try {
                if (bot.blockAt(coord).type === 0) {
                    await equipIronOreIfNeeded(bot);
                    await bot._genericPlace(bot.blockAt(coord), new Vec3(0, 1, 0), { forceLook: 'ignore' });
                    await new Promise(r => setTimeout(r, 50));
                }
            } catch (e) {
                //console.error('放置鐵礦石時發生錯誤:', e);
            }
        }

        console.log('finished placing iron ore');
    } catch (error) {
        //console.error('Error in place_iron_ore:', error);
    }
}

/**
 * mine blocks
 * @param {import('mineflayer').Bot} bot 
 */
async function mine_iron_ore(bot) {
    try {
        const pos = bot.entity.position;
        const yValues = [0, 1, 2];
        const directions = [
            [0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0],
            [-1, 0, -1], [-1, 0, 1], [1, 0, -1], [1, 0, 1],
        ];

        await equipPickaxe(bot);

        for (const y of yValues) {
            for (const [dx, _, dz] of directions) {
                const x = Math.floor(pos.x) + dx;
                const z = Math.floor(pos.z) + dz;
                const blockPos = new Vec3(x, Math.floor(pos.y) + y, z);
                
                await mineBlock(bot, blockPos);
            }
        }

        await mineBlock(bot, new Vec3(Math.floor(pos.x), Math.floor(pos.y) + 2, Math.floor(pos.z)))

        console.log('finished mining iron ore');
    } catch (error) {
        //console.error('Error in mine_iron_ore:', error);
    }
}

/**
 * throw ore
 * @param {import('mineflayer').Bot} bot 
 */
async function throw_raw_iron_block(bot) {
    try {
        for (const item of bot.inventory.items()) {
            if (item.type === 69 || item.type === 769) {
                console.log(`丟出 ${item.name} ${item.count}`);
                await bot.tossStack(item);
            }
        }
    } catch (error) {
        //console.error('Error in throw_raw_iron_block:', error);
    }
}

/**
 * throw trash
 * @param {import('mineflayer').Bot} bot 
 */
async function throw_trash(bot) {
    try {
        for (const item of bot.inventory.items()) {
            if (item.type !== 804 && item.type !== 69 && item.type !== 769) {
                console.log(`丟出 ${item.name} ${item.count}`);
                await bot.tossStack(item);
            }
        }
    } catch (error) {
        //console.error('Error in throw_trash:', error);
    }
}

/**
 * find shulker box
 * @param {import('mineflayer').Bot} bot 
 * @returns {Promise<import('prismarine-block').Block>}
 */
async function findShulkerBox(bot) {
    const shulkerBox = bot.findBlock({
        point: bot.entity.position,
        matching: 613,
        maxDistance: 7
    });

    if (!shulkerBox) {
        const config = JSON.parse(await fs.readFile(`${process.cwd()}/config.json`, 'utf8'));
        return bot.blockAt(new Vec3(config.position[0], config.position[1], config.position[2]));
    }

    return shulkerBox;
}

/**
 * open shulker box
 * @param {import('mineflayer').Bot} bot 
 * @param {import('prismarine-block').Block} shulkerBox 
 * @returns {Promise<import('mineflayer').Window>}
 */
async function openShulkerBox(bot, shulkerBox) {
    let shulkerBoxWindow = await bot.openBlock(shulkerBox);

    while (!shulkerBoxWindow) {
        console.log('shulker_box_window not found...\nopening shulker_box_window...');
        shulkerBoxWindow = await bot.openBlock(shulkerBox);
    }

    console.log('opened shulker_box_window');
    return shulkerBoxWindow;
}

/**
 * get all items
 * @param {import('mineflayer').Bot} bot 
 * @param {import('mineflayer').Window} window 
 */
async function withdrawAllItems(bot, window) {
    for (const item of window.containerItems()) {
        if (!window) {
            console.log('shulker_box_window not found...\nopening shulker_box_window...');
            window = await bot.openBlock(shulkerBox);
        }

        try {
            console.log(`withdraw ${item.type} ${item.metadata} ${item.count}`);
            await window.withdraw(item.type, item.metadata, item.count);
        } catch (e) {
            console.log(`${e.trace}`);
        }
    }
}

/**
 * get surrounding blocks
 * @param {import('mineflayer').Bot} bot 
 * @returns {Vec3[]}
 */
function getSurroundingBlockCoords(bot) {
    const pos = bot.entity.position;
    const yValues = [0, 1, 2];
    const directions = [
        [0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0],
        [-1, 0, -1], [-1, 0, 1], [1, 0, -1], [1, 0, 1],
        [0, 2, 0], [0, 2, 0]
    ];

    return yValues.flatMap(y =>
        directions.map(([dx, dy, dz]) =>
            new Vec3(
                Math.floor(pos.x) + dx,
                Math.floor(pos.y) + y,
                Math.floor(pos.z) + dz
            )
        )
    );
}

/**
 * equip iron_ore
 * @param {import('mineflayer').Bot} bot 
 */
async function equipIronOreIfNeeded(bot) {
    const heldItem = bot.heldItem;
    if (!heldItem || heldItem.name !== 'iron_ore') {
        const ironOre = bot.inventory.items().find(item => item.name === 'iron_ore');
        if (!ironOre) return;
        await bot.equip(51, 'hand');
        console.log('equipped iron_ore');
    }
}

/**
 * equip pickaxe
 * @param {import('mineflayer').Bot} bot 
 */
async function equipPickaxe(bot) {
    const pickaxe = bot.inventory.items().find(item => item.name === 'netherite_pickaxe');
    if (!pickaxe) return;
    await bot.equip(804, 'hand');
    console.log('equipped pickaxe');
}

/**
 * mine block
 * @param {import('mineflayer').Bot} bot 
 * @param {Vec3} blockPos 
 */
async function mineBlock(bot, blockPos) {
    const block = bot.blockAt(blockPos);
    if (!block || block.type === 0) return;

    await equipPickaxe(bot);

    console.log(`mining (${blockPos.x}, ${blockPos.y}, ${blockPos.z})`);
    console.log(`digtime: ${bot.digTime(block)}`);

    const digPromise = bot.dig(block, 'ignore', 'raycast');
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Digging timeout')), 500)
    );

    try {
        await Promise.race([digPromise, timeoutPromise]);
    } catch (error) {
        if (error.message !== 'Digging timeout') {
            //console.error('Error while mining:', error);
        }
    }

    await new Promise(r => setTimeout(r, 50));
}

/**
 * count inventory item
 * @param {import('mineflayer').Bot} bot 
 * @param {string} itemName 
 * @returns {number}
 */
function countInventoryItem(bot, itemName) {
    return bot.inventory.items().reduce((count, item) => 
        item.name === itemName ? count + item.count : count, 0
    );
}

/**
 * open shop
 * @param {import('mineflayer').Bot} bot 
 * @returns {Promise<import('mineflayer').Window>}
 */
async function openShopWindow(bot) {
    return new Promise((resolve) => {
        bot.chat(`/shop_item`);
        bot.once("windowOpen", (window) => {
            clearTimeout(timeout);
            resolve(window);
        });
        const timeout = setTimeout(() => resolve(undefined), 5000);
    });
}

module.exports = {
    get_iron_ore,
    shop_item,
    place_iron_ore,
    mine_iron_ore,
    throw_raw_iron_block,
    throw_trash
};