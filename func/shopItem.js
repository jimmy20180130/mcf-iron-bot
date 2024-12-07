const Logger = require('../utils/logger');

async function shopItem(bot) {
    let ironIngotCount = bot.inventory.items().filter(item => item.name === 'iron_ingot').reduce((sum, item) => sum + item.count, 0);
    Logger.log(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 鐵錠數量: ${ironIngotCount}`)
    
    async function shopItemWindow() {
        try {
            await bot.closeWindow(bot.currentWindow)
        } catch (e) {}

        bot.currentWindow = undefined;

        return await new Promise((async resolve => {
            await bot.chat(`/shop_item`)
            bot.once("windowOpen", function o(window) {
                clearTimeout(timeout)

                for (listener of bot.listeners('windowOpen')) {
                    bot.removeListener('windowOpen', listener);
                }

                resolve(window);
            })
            const timeout = setTimeout(()=>{
                for (listener of bot.listeners('windowOpen')) {
                    bot.removeListener('windowOpen', listener);
                }
                resolve(undefined);
            }, 5000)
        }))
    }

    bot.currentWindow = await shopItemWindow();

    let cooldown = 0;
    let notEnoughIronIngot = 0;

    bot.on('messagestr', (msg) => {
        if (msg == '[系統] 這個功能需要冷卻 1 秒，請耐心等候') {
            cooldown++
        } else if (msg.includes('[系統] 你必須有 鐵錠') && msg.startsWith('[系統] 你必須有 鐵錠')) {
            notEnoughIronIngot++
        }
    })

    async function shopItemProcess() {
        for (let i=0; i< Math.floor(ironIngotCount/64); i++) {
            if (!bot.currentWindow) {
                try {
                    await bot.closeWindow(bot.currentWindow)
                } catch (e) {}
                
                bot.currentWindow = await shopItemWindow();
            }

            if (notEnoughIronIngot > 30) {
                Logger.error(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 錯誤: 鐵錠數量不足`)
                ironIngotCount = 0;
                return
            }
            
            await bot.simpleClick.leftMouse(1)
            Logger.log(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 成功兌換鐵錠至鐵原礦`);
            //ironIngotCount = bot.inventory.items().filter(item => item.name === 'iron_ingot').reduce((sum, item) => sum + item.count, 0);
            //Logger.log(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 鐵錠數量: ${ironIngotCount}`)
            await new Promise(r => setTimeout(r, 250))
        }

        try {
            await bot.closeWindow(bot.currentWindow)
        } catch (e) {}

        ironIngotCount = bot.inventory.items().filter(item => item.name === 'iron_ingot').reduce((sum, item) => sum + item.count, 0);

        if (ironIngotCount/64 >= 1) {
            Logger.log(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 仍有 ${ironIngotCount} 個鐵錠未兌換，將繼續兌換...`)
            await shopItemProcess()
        }
    }

    await shopItemProcess()
    await new Promise(r => setTimeout(r, 2000))

    for (listener of bot.listeners('messagestr')) {
        bot.removeListener('messagestr', listener);
    }

    try {
        await bot.closeWindow(bot.currentWindow)
        bot.currentWindow = undefined;
    } catch (e) {
        Logger.error(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 發生錯誤: ${e}`)
    }

    Logger.log(`[\x1b[34mS\x1b[0mHOP\x1b[34mI\x1b[0mTEM] 成功兌換所有鐵錠至鐵原礦`)
}

module.exports = shopItem;