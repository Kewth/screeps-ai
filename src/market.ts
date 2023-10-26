import { myMax, myMin } from "utils/other"

const roomName = 'E26S27'
export function marketWork() {
    if (!Game.rooms[roomName]) return
    market_pixel()
    market_energy()
}

function market_pixel() {
    // const std_price = 35000
    const sell_price = 40000
    const buy_price = 30000
    const buy = myMax(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: PIXEL }), obj => obj.price)
    if (buy && buy.price >= sell_price) {
        Game.market.deal(buy.id, 10)
    }
    const sell = myMin(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: PIXEL }), obj => obj.price)
    if (sell && sell.price <= buy_price && Game.market.credits >= 5_000_000) {
        Game.market.deal(sell.id, 10)
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
