const Logger = require('../utils/logger');
const fs = require('fs');

async function throwTrash(bot) {
    const hasTrash = bot.inventory.items().some(item => ![770, 769, 69, 804, 836, 837, 838, 839, 51].includes(item.type));

    if (hasTrash) {
        await bot.chat('/rtp')
        await new Promise(r => setTimeout(r, 5000))

        for (const item of bot.inventory.items()) {
            if (item.type != 770 && item.type != 769 && item.type != 69 && item.type != 804 && item.type != 836 && item.type != 837 && item.type != 838 && item.type != 839 && item.type != 51) {
                Logger.log(`[\x1b[34mT\x1b[0mHROW\x1b[34mT\x1b[0mRASH] 丟棄 ${item.count} 個 ${item.type}，該物品之 metadata: ${item.metadata}`)
                await bot.tossStack(item)
            }
        }

        Logger.log('[\x1b[34mT\x1b[0mHROW\x1b[34mT\x1b[0mRASH] 成功丟棄所有垃圾')

        let config = JSON.parse(fs.readFileSync(`${process.cwd()}/config.json`, 'utf8'))
        await bot.chat(config.mine_warp)
        await new Promise(r => setTimeout(r, 4000))
    } else {
        Logger.log('[\x1b[34mT\x1b[0mHROW\x1b[34mT\x1b[0mRASH] 包包內並沒有垃圾，無需丟棄')
    }
}

module.exports = throwTrash;