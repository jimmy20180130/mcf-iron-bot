const Logger = require('../utils/logger');
const fs = require('fs');
const Vec3 = require('vec3').Vec3;

async function getIron(bot) {
    try {
        let config = JSON.parse(fs.readFileSync(`${process.cwd()}/config.json`, 'utf8'))

        async function getShulkerBox() {
            let shulker_box = bot.findBlock({
                point: bot.entity.position,
                matching: 613,
                maxDistance: 7
            })

            if (!shulker_box && config.shulker_position && config.shulker_position.length === 3) {
                shulker_box = bot.blockAt(new Vec3(config.shulker_position[0], config.shulker_position[1], config.shulker_position[2]))
            }

            if (!shulker_box || shulker_box.type != 613) {
                Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 無法找到界伏盒，將在不久後重試...')
                await new Promise(r => setTimeout(r, 1000))
                shulker_box = await getShulkerBox()
            } else {
                return shulker_box
            }
        }

        let shulker_box = await getShulkerBox()

        Logger.log(`[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 在座標 ${shulker_box.position} 發現了界伏盒`)

        let shulker_box_window = await bot.openBlock(shulker_box)

        while (!shulker_box_window) {
            Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 無法找到界伏盒，將在不久後重試...')
            shulker_box_window = await bot.openBlock(shulker_box)
        }

        Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 正在打開界伏盒...')

        await new Promise(r => setTimeout(r, 1000))

        async function shulker_box_process() {
            let hasErrors = false

            for (const item of shulker_box_window.containerItems()) {
                if (!shulker_box_window) {
                    Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 無法開啟界伏盒，將在不久後重試...')
                    shulker_box_window = await bot.openBlock(shulker_box)
                }

                try {
                    Logger.log(`[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 成功拿出 ${item.count} 個 ${item.type}，該物品之 metadata: ${item.metadata}`)
                    await shulker_box_window.withdraw(item?.type, item?.metadata, item?.count)
                } catch (e) {
                    Logger.error(`[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 發現錯誤: ${e}`)
                    hasErrors = true
                    break
                }
            }

            if (hasErrors) {
                Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 遇到錯誤，將在不久後重試...')
                await new Promise(r => setTimeout(r, 1000))
                shulker_box_window = await bot.openBlock(shulker_box)
                hasErrors = false
                await shulker_box_process()
            }
        }

        await shulker_box_process()

        let ironIngotCount = bot.inventory.items().filter(item => item.name === 'iron_ingot').reduce((sum, item) => sum + item.count, 0);
        if (ironIngotCount >= 64) {
            Logger.log(`[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 包包內有 ${ironIngotCount} 個鐵錠，將開始兌換...`)
        } else {
            await shulker_box_process()
        }

        shulker_box_window.close()
        Logger.log('[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 成功拿出所有物品')
    } catch (e) {
        Logger.error(`[\x1b[34mG\x1b[0mET\x1b[34mI\x1b[0mRON] 發現錯誤: ${e}`)
    }
}

module.exports = getIron;