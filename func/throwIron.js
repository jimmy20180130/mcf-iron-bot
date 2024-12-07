const Logger = require('../utils/logger');

async function throwRawIronBlock(bot) {
    for (const item of bot.inventory.items()) {
        if (item.type != 69 && item.type != 769) {
            continue
        } else {
            Logger.log(`\x1b[34mT\x1b[0mHROW\x1b[34mI\x1b[0mRON 已成功丟出 ${item.name} ${item.count}`)
            await bot.tossStack(item)
        }
    }
}

module.exports = throwRawIronBlock;