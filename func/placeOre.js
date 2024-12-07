const Logger = require('../utils/logger');
const Vec3 = require('vec3');

async function placeIronOre(bot) {
    async function getSurroundingBlockCoords() {
        const pos = bot.entity.position;
        const yValues = [0, 1, 2];

        const dirs = [
            [0, 0, -1],
            [0, 0, 1], 
            [-1, 0, 0],
            [1, 0, 0],   
            [-1, 0, -1],
            [-1, 0, 1],
            [1, 0, -1],  
            [1, 0, 1],
        ];

        let coords = [];
        for (let y of yValues) {
            for (let dir of dirs) {
                let x = Math.floor(pos.x) + dir[0];
                let z = Math.floor(pos.z) + dir[2];
                coords.push(new Vec3(x, Math.floor(pos.y) + y, z));
            }
        }

        // add the block above the player
        coords.push(new Vec3(Math.floor(pos.x), Math.floor(pos.y) + 2, Math.floor(pos.z)));

        return coords;
    }

    let iron_ore = bot.inventory.items().find(item => item.name === 'iron_ore')
    if (!iron_ore) return
    await bot.equip(51, 'hand')
    Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已拿著鐵原礦`)

    for (const coord of await getSurroundingBlockCoords()) {
        try {
            Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 已在座標 ${coord} 上放置鐵原礦方塊`)
            if (bot.blockAt(coord).type == 0) {
                try {
                    const heldItem = bot.heldItem
                    if (heldItem && heldItem.name != 'iron_ore') {
                        let iron_ore = bot.inventory.items().find(item => item.name === 'iron_ore')
                        if (!iron_ore) return
                        await bot.equip(51, 'hand')
                        Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已拿著鐵原礦`)
                    }

                    await bot._genericPlace(bot.blockAt(coord), new Vec3(0, 1, 0), { forceLook: 'ignore' })

                } catch (e) {}

                await new Promise(r => setTimeout(r, 50))
            }
        } catch (e) {}
    }

    Logger.log('[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已放置完鐵原礦')
}

module.exports = placeIronOre;