const Item = require('prismarine-item')('1.20')
const Vec3 = require('vec3').Vec3

async function get_iron_ore(bot) {
    let shulker_box = bot.findBlock({
        matching: 613,
        maxDistance: 5
    })

    if (!shulker_box) {
        console.log('shulker_box not found')
        return
    }

    console.log(`shulker_box found: ${shulker_box.position}`)

    let shulker_box_window = await bot.openContainer(shulker_box)

    console.log('opened shulker_box_window')

    for (const item of shulker_box_window.containerItems()) {
        if (!shulker_box_window) {
            console.log('shulker_box_window not found...\nopening shulker_box_window...')
            shulker_box_window = await bot.openContainer(shulker_box)
        }

        try {
            console.log(`withdraw ${item.type} ${item.metadata} ${item.count}`)
            await shulker_box_window.withdraw(item.type, item.metadata, item.count)
        } catch (e) {
            console.log(`${e.trace}`)
        }
    }

    shulker_box_window.close()
    console.log('finished_getting_iron')
}

async function shop_item(bot) {
    await new Promise(r => setTimeout(r, 3000))

    let iron_ingot_count = 0
    for (const item of bot.inventory.items()) {
        if (item.name == 'iron_ingot') {
            iron_ingot_count += item.count
        }
    }

    let shop_item_window = await new Promise((async resolve => {
        bot.chat(`/shop_item`)
        bot.once("windowOpen", function o(window) {
            clearTimeout(timeout)
            resolve(window);
        })
        const timeout = setTimeout(()=>{
            resolve(undefined);
        },5000)
    }))

    for (let i=0; i< Math.floor(iron_ingot_count/64); i++) {
        if (shop_item_window) {
            await bot.simpleClick.leftMouse(1)
            console.log(`成功兌換鐵錠至鐵原礦`)
        } else {
            shop_item_window = await new Promise((async resolve => {
                bot.chat(`/shop_item`)
                bot.once("windowOpen", function o(window) {
                    clearTimeout(timeout)
                    resolve(window);
                })
                const timeout = setTimeout(()=>{
                    resolve(undefined);
                },5000)
            }))

            console.log('已打開視窗')

            i--
        }

        await new Promise(r => setTimeout(r, 1000))
    }

    try {
        await bot.closeWindow(shop_item_window)
    } catch (e) {}
}

async function place_iron_ore(bot) {
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
            [1, 0, 1]
        ];

        let coords = [];
        for (let y of yValues) {
            for (let dir of dirs) {
                let x = Math.floor(pos.x) + dir[0];
                let z = Math.floor(pos.z) + dir[2];
                coords.push(new Vec3(x, Math.floor(pos.y) + y, z));
            }
        }

        return coords;
    }

    let iron_ore = bot.inventory.items().find(item => item.name === 'iron_ore')
    if (!iron_ore) return
    await bot.equip(51, 'hand')
    console.log(`equpped iron_ore`)

    for (const coord of await getSurroundingBlockCoords()) {
        console.log(`place ${coord}`)
        if (bot.blockAt(coord).type == 0) {
            try {
                const heldItem = bot.heldItem
                if (heldItem && heldItem.name != 'iron_ore') {
                    let iron_ore = bot.inventory.items().find(item => item.name === 'iron_ore')
                    if (!iron_ore) return
                    await bot.equip(51, 'hand')
                    console.log(`equpped iron_ore`)
                }

                await bot._genericPlace(bot.blockAt(coord), new Vec3(0, 1, 0), { forceLook: 'ignore' })

            } catch (e) {}

            await new Promise(r => setTimeout(r, 50))
        }
    }

    console.log('finished placing iron ore')
}

async function mine_iron_ore(bot) {
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
    console.log(`equpped pickaxe`)

    for (let y of yValues) {

        for (let dir of dirs) {
            let x = Math.floor(pos.x) + dir[0];
            let z = Math.floor(pos.z) + dir[2];

            console.log(`mining (${x}, ${Math.floor(pos.y) + y}, ${z})`)

            if (bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)).type == 0) {
                continue
            } else if (bot.heldItem && bot.heldItem.name != 'netherite_pickaxe') {
                let pickaxe = bot.inventory.items().find(item => item.name === 'netherite_pickaxe')
                if (!pickaxe) return
                await bot.equip(804, 'hand')
                console.log(`equpped pickaxe`)
            }
            
            const dig_promise = bot.dig(bot.blockAt(new Vec3(x, Math.floor(pos.y) + y, z)), 'ignore', 'raycast')
            const timeoutpromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('timeout')
                }, 500)
            })

            await Promise.race([dig_promise, timeoutpromise])
        }
    }

    console.log('finished mining iron ore')
}

async function throw_raw_iron_block(bot) {
    for (const item of bot.inventory.items()) {
        if (item.type != 69 && item.type != 769) {
            continue
        } else {
            console.log(`丟出 ${item.name} ${item.count}`)
            await bot.tossStack(item)
        }
    }
}

// async function craft_iron_ore(bot) {
//     bot.chat('/homes craft')
//     function stringifyItem(item) {
//         const mdItem = bot.registry.items[item.id]
//         return `${mdItem.name} x ${item.count}`
//     }

//     const items = bot.inventory.items().map(item => {return {id: item.type, count: item.count}})
    
//     const amount = await new Promise(async (resolve, reject) => {
//         await new Promise(r => setTimeout(r, 100))
//         let amount = 0
//         for (const item of bot.inventory.items()) {
//             if (item.type === 769) amount += item.count
//         }

//         if (amount == 0) amount = 1
//         resolve(amount)
//     })

//     for (let i=0; i<amount/64; i++) {
//         const craft = async () => {
//             console.log(amount)

//             let iron_block_to_craft

//             if (amount - i*64 < 64) {
//                 iron_block_to_craft = {id: 69, count: amount}
//             } else {
//                 iron_block_to_craft = {id: 69, count: 64}
//             }

//             const craft_plan = bot.planCraft(iron_block_to_craft, {availableItems: items})  
//             console.log(craft_plan)
            
//             if (craft_plan.success === false) {
//                 await bot.chat("Can't craft that")
//                 console.log(craft_plan)
//                 return;
//             }

//             let craftingTable = false;
//             if (craft_plan.requiresCraftingTable) {
//                 craftingTable = await bot.findBlock({
//                     matching: bot.registry.blocksByName.crafting_table.id,
//                     maxDistance: 3
//                 })

//                 if (!craftingTable) {
//                     bot.chat("No crafting table found")
//                     return;
//                 }

//             }

//             for (const info of craft_plan.recipesToDo) {
//                 console.log(craft_plan.recipesToDo)
//                 console.log(info.recipe.delta.map(stringifyItem).join(", "))
//                 console.log(`Crafting ${bot.registry.items[info.recipe.result.id].name} x ${info.recipe.result.count}`)
//                 await bot.craft(info.recipe, info.recipeApplications, craftingTable)
//                 await bot.waitForTicks(10)
//             }

//             const mdItem3 = bot.registry.items[iron_block_to_craft.id];
//             await bot.chat(`Crafted ${mdItem3.name} ${iron_block_to_craft.count}`)

//             await new Promise(r => setTimeout(r, 1000))
//         }

//         await craft()
//     }
// }

module.exports = {
    get_iron_ore,
    shop_item,
    place_iron_ore,
    mine_iron_ore,
    throw_raw_iron_block
}