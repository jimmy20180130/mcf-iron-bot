const Vec3 = require('vec3')
const Logger = require('../utils/logger')

async function mineIronOre(bot) {
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
        [1, 0, 1]
    ];

    let pickaxe = bot.inventory.items().find(item => item.name === 'netherite_pickaxe')
    if (!pickaxe) return
    await bot.equip(804, 'hand')
    Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已拿著獄髓鎬`)

    let minedBlocks = 0

    bot.on('blockUpdate', async (oldBlock, newBlock) => {
        //detect if the block is destroyed
        if (oldBlock.type == 41 && newBlock.type == 0) {
            Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 已挖掘座標 (${newBlock.position.x}, ${newBlock.position.y}, ${newBlock.position.z}) 上的鐵原礦方塊`)
            minedBlocks++;
        }
    });

    for (let y of yValues) {

        for (let dir of dirs) {
            if (!bot) continue

            try {
                let x = Math.floor(pos.x) + dir[0];
                let z = Math.floor(pos.z) + dir[2];

                if (!bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)) || bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)).type == 0 || !bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)).type) {
                    continue
                } else if (bot.heldItem && bot.heldItem.name != 'netherite_pickaxe') {
                    let pickaxe = bot.inventory.items().find(item => item.name === 'netherite_pickaxe')
                    if (!pickaxe) return
                    await bot.equip(804, 'hand')
                    Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已拿著獄髓鎬`)
                }

                Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 正在挖掘座標 (${x}, ${Math.floor(pos.y) + y}, ${z}) 上的鐵原礦方塊`)
                Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 挖掘時間: ${bot.digTime(bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)))}`)

                if (bot.digTime(bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z))) > 100) {
                    Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 挖掘時間過長，將跳過此方塊`)
                    continue
                }
                
                const dig_promise = bot.dig(bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)), 'ignore', 'raycast')
                
                let timeout
                const timeoutpromise = new Promise((resolve, reject) => {
                    timeout = setTimeout(() => {
                        resolve('timeout')
                    }, 500)
                })

                await Promise.race([dig_promise, timeoutpromise])
                clearTimeout(timeout)
                await new Promise(r => setTimeout(r, 50))
            } catch (e) {}
        }
    }

    if (bot) {
        try {
            let x = Math.floor(pos.x);
            let z = Math.floor(pos.z);

            Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 正在挖掘座標 (${x}, ${Math.floor(pos.y) + 2}, ${z}) 上的鐵原礦方塊`)
            Logger.log(`[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] 挖掘時間: ${bot.digTime(bot.blockAt(new Vec3(x, Math.floor(pos.y) + 2, z)))}`)
            
            const dig_promise = bot.dig(bot.blockAt(new Vec3(x, Math.floor(pos.y) + 2, z)), 'ignore', 'raycast')
            
            let timeout
            const timeoutpromise = new Promise((resolve, reject) => {
                timeout = setTimeout(() => {
                    resolve('timeout')
                }, 500)
            })

            await Promise.race([dig_promise, timeoutpromise])
            clearTimeout(timeout)
            await new Promise(r => setTimeout(r, 50))
        } catch (e) {}
    }

    Logger.log('[\x1b[34mP\x1b[0mLACE\x1b[34mM\x1b[0mINE\x1b[34mI\x1b[0mRON] Bot 已挖掘鐵原礦方塊完畢')

    for (listener of bot.listeners('blockUpdate')) {
        bot.removeListener('blockUpdate', listener);
    }

    return minedBlocks
}

module.exports = mineIronOre;