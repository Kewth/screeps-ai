import { myMax, myMin } from "utils/other"

export function marketWork() {
    market_pixel()
    market_energy()
}

function market_pixel() {
    if (Memory.pixelActiveAmount && Game.time % 10 <= 0) {
        const avgPrice = Memory.pixelActiveTotalPrice / Memory.pixelActiveAmount
        const sellPrice = avgPrice * 1.1
        const buyPrice = avgPrice * 0.9
        // const amountLimit = 1000
        const buy = myMax(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: PIXEL }), obj => obj.price)
        if (buy && buy.price > sellPrice && Memory.pixelActiveAmount > 20) {
            if (Game.market.deal(buy.id, 10) == OK) {
                Memory.pixelActiveAmount -= 10
                Memory.pixelActiveTotalPrice -= 10 * avgPrice
            }
        }
        const sell = myMin(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: PIXEL }), obj => obj.price)
        if (sell && sell.price < buyPrice && Game.market.credits >= 20_000_000) {
            if (Game.market.deal(sell.id, 10) == OK) {
                Memory.pixelActiveAmount += 10
                Memory.pixelActiveTotalPrice += 10 * sell.price
            }
        }
    }
}

function market_energy() {
    // const sell_price = 10
    // const amount = 10_000
    // if (!Game.rooms[roomName].terminal) return
    // if (Game.rooms[roomName].terminal.store[RESOURCE_ENERGY] < amount) return
    // Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).forEach(buy => {
    //     if (buy.price > sell_price && buy.roomName && buy.remainingAmount >= amount) {
    //         const excost = Game.market.calcTransactionCost(amount, buy.roomName, roomName)
    //         if (buy.price * amount / (amount + excost) > sell_price) {
    //             Game.market.deal(buy.id, amount, roomName)
    //         }
    //     }
    // })
}
