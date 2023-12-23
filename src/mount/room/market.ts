import { ToN, compressResourceType, logConsole, logError } from "utils/other"

// function getOrder(room: Room, focus: FocusOrder) {
//     if (focus.id) return Game.market.orders[focus.id]
//     const order = Object.values(Game.market.orders).find(o =>
//         o.roomName == room.name
//         && o.type == TODO
//         && o.resourceType == focus.resource
//     )
//     if (!order) {
//         logError('cannot find order', room.name)
//         return undefined
//     }
//     focus.id = order.id
//     return order
// }

function yesterdayPrice (resource: ResourceConstant) {
    const hitstory = Game.market.getHistory(resource)
    if (hitstory.length < 2) return undefined
    return hitstory[hitstory.length - 2].avgPrice
}

function todayPrice (resource: ResourceConstant) {
    const hitstory = Game.market.getHistory(resource)
    if (hitstory.length < 1) return undefined
    return hitstory[hitstory.length - 1].avgPrice
}

interface LogicalOrder {
    id?: string // only real order has id
    type: ORDER_BUY | ORDER_SELL
    resourceType: ResourceConstant
    price?: number
    remainingAmount: number
    // roomName: number
}

function findOrder(room: Room, resource: ResourceConstant, type: ORDER_SELL | ORDER_BUY): LogicalOrder {
    const order = Object.values(Game.market.orders).find(o =>
        o.roomName == room.name
        && o.type == type
        && o.resourceType == resource
    )
    return order ? {
        id: order.id,
        type: type,
        resourceType: resource,
        price: order.price,
        remainingAmount: order.remainingAmount,
    } : {
        type: type,
        resourceType: resource,
        remainingAmount: 0,
    }
}

function changeOrder (room: Room, order: LogicalOrder, addAmount: number, newPrice: number, mixPrice: boolean = false) {
    if (!order.id) {
        if (addAmount > 0) {
            const resp = Game.market.createOrder({
                type: order.type,
                resourceType: order.resourceType,
                price: newPrice,
                totalAmount: addAmount,
                roomName: room.name,
            })
            if (resp != OK) { logError(`create Order get ${resp}`, room.name); return false }
        }
    }
    else {
        if (!order.price) return false // real order must have price
        if (mixPrice) {
            const totalPrice = order.remainingAmount * order.price + addAmount * newPrice
            const totalAmount = order.remainingAmount + addAmount
            newPrice = totalPrice / totalAmount
        }
        if (newPrice != order.price) {
            const resp = Game.market.changeOrderPrice(order.id, newPrice)
            if (resp != OK) { logError(`change Price get ${resp}`, room.name); return false }
        }
        if (addAmount > 0) {
            const resp = Game.market.extendOrder(order.id, addAmount)
            if (resp != OK) { logError(`extend Order get ${resp}`, room.name); return false }
        }
    }
    return true
}

function checkOrder(room: Room, order: LogicalOrder, amountPlan: number, amountLimit: number): void {
    const difAmount = amountLimit - order.remainingAmount
    // 没有成交，悲观
    if (difAmount <= 0) {
        const tp = todayPrice(order.resourceType)
        // const mtp = tp ? tp * 0.9 : undefined
        const mtp = tp
        const op = order.price
        const price = (order.type === ORDER_BUY)
            ? ((mtp && op && mtp > op) ? op * 0.8 + mtp * 0.2 : op)
            : ((mtp && op && mtp < op) ? op * 0.8 + mtp * 0.2 : op)
        price && changeOrder(room, order, 0, price)
        logConsole(`${room.name} ${order.type} ${order.resourceType} 悲观调价: ${order.price} -> ${price}`)
        return
    }
    // 可能需要补货，计算一下能不能补
    if (order.type === ORDER_SELL) {
        const storeAmount = ToN(room.storage?.store[order.resourceType]) + ToN(room.terminal?.store[order.resourceType])
        if (storeAmount < order.remainingAmount + amountPlan)
            return
    }
    if (order.type === ORDER_BUY) {
        if (Game.market.credits < 20_000_000)
            return
    }
    // 成交了一点点，原价补货
    if (difAmount < amountPlan) {
        order.price && changeOrder(room, order, difAmount, order.price)
        logConsole(`${room.name} ${order.type} ${order.resourceType} 原价补货 ${difAmount}`)
    }
    // 成交量不错，乐观
    else {
        const yp = yesterdayPrice(order.resourceType)
        const tp = todayPrice(order.resourceType)
        let price = (order.type == ORDER_BUY)
            ? (yp && tp && yp < tp) ? yp : tp
            : (yp && tp && yp > tp) ? yp : tp
        if (price) {
            if (difAmount >= amountLimit) // 起步，再乐观点
                price *= (order.type == ORDER_BUY) ? 0.8 : 1.2
            changeOrder(room, order, amountPlan, price, true)
            logConsole(`${room.name} ${order.type} ${order.resourceType} 混合补货 ${amountPlan} 价格 ${price}`)
        }
        else {
            order.price && changeOrder(room, order, amountPlan, order.price)
            logConsole(`${room.name} ${order.type} ${order.resourceType} 原价补货 ${amountPlan}`)
        }
    }
}

// function sell(room: Room, order: LogicalOrder, amountPlan: number, amountLimit: number): void {
//     if (order.type != ORDER_SELL) return
//     const sellAmount = amountLimit - order.remainingAmount
//     // 卖不动，尝试降价不补货
//     if (sellAmount <= 0) {
//         const tp = todayPrice(order.resourceType)
//         const op = order.price
//         const price = (tp && op && tp < op) ? op * 0.8 + tp * 0.2 : op
//         price && changeOrder(room, order, 0, price)
//         return
//     }
//     // 可能需要补货，计算一下能不能补
//     const storeAmount = ToN(room.storage?.store[order.resourceType]) + ToN(room.terminal?.store[order.resourceType])
//     if (storeAmount < order.remainingAmount + amountPlan)
//         return
//     // 卖了一点点，原价补货
//     if (sellAmount < amountPlan)
//         order.price && changeOrder(room, order, sellAmount, order.price)
//     // 卖得不错，根据历史价格补货
//     else {
//         const yp = yesterdayPrice(order.resourceType)
//         const tp = todayPrice(order.resourceType)
//         const price = (yp && tp && yp > tp) ? yp : tp
//         if (price) changeOrder(room, order, amountPlan, price, true)
//         else order.price && changeOrder(room, order, amountPlan, order.price)
//     }
// }

export function mountMarket() {
    Room.prototype.work_market = function(force?: boolean) {
        if (Game.time % 1000 <= 0 || force) {
            // 卖能量
            if (this.controller && this.controller.level >= 8) {
                const order = findOrder(this, RESOURCE_ENERGY, ORDER_SELL)
                if (this.storage?.highEnergy())
                    checkOrder(this, order, 10_000, 50_000)
                else if (this.storage?.mediumHighEnergy())
                    checkOrder(this, order, 5_000, 20_000)
            }
            // 卖电池
            if (this.controller && this.controller.level >= 8
                && this.storage && this.storage.store[RESOURCE_BATTERY] > 100_000) {
                const order = findOrder(this, RESOURCE_BATTERY, ORDER_SELL)
                checkOrder(this, order, 50, 1000)
            }
            // 卖矿
            const mineralType = this.mineral()?.mineralType
            if (mineralType) {
                const order = findOrder(this, mineralType, ORDER_SELL)
                checkOrder(this, order, 1000, 10_000)
            }
            // 卖压缩矿
            const compressType = mineralType ? compressResourceType(mineralType) : undefined
            if (compressType) {
                const order = findOrder(this, compressType, ORDER_SELL)
                checkOrder(this, order, 100, 2000)
            }
            // 买抛瓦
            if (this.myPowerSpawn() && this.storage?.mediumHighEnergy()) {
                const order = findOrder(this, RESOURCE_POWER, ORDER_BUY)
                checkOrder(this, order, 500, 10_000)
            }
        }
    }

    // Room.prototype.market_buyingOrder = function(focus: FocusOrder) {
    //     const order = getOrder(this, focus)
    //     if (!order) return
    //     const resourceConst = marketConst2resourceConst(order.resourceType)
    //     if (resourceConst === undefined) return
    //     // 买完了
    //     if (order.remainingAmount <= 0) {
    //         if (focus.timeEnd === undefined) focus.timeEnd = Game.time
    //         const timeUsed = focus.timeEnd - focus.timeBegin
    //         // 限额到了
    //         if (focus.amountLimit !== undefined && order.totalAmount !== undefined && order.totalAmount >= focus.amountLimit) {
    //             focus.dead = true
    //             return
    //         }
    //         let newPrice = order.price
    //         // 以一定概率降低购价
    //         if (Math.random() < 0.5)
    //             newPrice *= 0.99
    //         const creditsNeed = newPrice * Setting.FOCUS_ORDER_AMOUNT_PER * 1.05
    //         const creditsLimit = Game.market.credits * 0.1
    //         // 没钱了，进一步降低购价
    //         if (creditsNeed > creditsLimit)
    //             newPrice = creditsLimit / Setting.FOCUS_ORDER_AMOUNT_PER / 1.05
    //         // 补充数量，新一轮监听
    //         Game.market.changeOrderPrice(order.id, newPrice)
    //         Game.market.extendOrder(order.id, Setting.FOCUS_ORDER_AMOUNT_PER)
    //         focus.timeBegin = Game.time + 1
    //         focus.timeEnd = undefined
    //     }
    //     // 超时了
    //     else if (Game.time - focus.timeBegin > Setting.FOCUS_ORDER_TIMEOUT) {
    //         // 提高购价不补充数量，新一轮监听
    //         const priceList = Game.market.getHistory(order.resourceType)
    //         const priceHis = priceList[priceList.length - 1]
    //         if (priceHis && order.price > priceHis.avgPrice)
    //             Game.market.changeOrderPrice(order.id, order.price * 1.005)
    //         else
    //             Game.market.changeOrderPrice(order.id, order.price * 1.02)
    //         focus.timeBegin = Game.time + 1
    //         focus.timeEnd = undefined
    //     }
    //     else {
    //     }
    // }

    // Room.prototype.market_sellingOrder = function(focus: FocusOrder) {
    //     const order = getOrder(this, focus)
    //     if (!order) return false
    //     const resourceConst = marketConst2resourceConst(order.resourceType)
    //     if (resourceConst === undefined) return false
    //     // 卖完了
    //     if (order.remainingAmount <= 0) {
    //         // 限额到了
    //         if (focus.amountLimit !== undefined && order.totalAmount !== undefined && order.totalAmount >= focus.amountLimit)
    //             return false
    //         // 终端资源不够，挂起
    //         const term = this.terminal
    //         if (!term || term.store[resourceConst] < focus.amountPer) {
    //         }
    //         else {
    //             // 增加大量价格
    //             Game.market.changeOrderPrice(order.id, order.price * 1.05)
    //             // 补货，新一轮监听
    //             Game.market.extendOrder(order.id, focus.amountPer)
    //             focus.timeBegin = Game.time + 1
    //             focus.timeEnd = undefined
    //         }
    //     }
    //     // 超时了
    //     else if (Game.time - focus.timeBegin > 1000) {
    //         // 降低一点价格不补货，新一轮监听
    //         Game.market.changeOrderPrice(order.id, order.price * 0.99)
    //         focus.timeBegin = Game.time + 1
    //         focus.timeEnd = undefined
    //     }
    //     // 还在卖
    //     else {
    //     }
    //     return true
    // }

    // Room.prototype.work_market = function() {
        // if (this.memory.sellingOrderList) {
        //     this.memory.sellingOrderList = this.memory.sellingOrderList.filter(
        //         focus => this.market_sellingOrder(focus)
        //     )
        // }
        // if (this.memory.buyingOrderList) {
        //     this.memory.buyingOrderList.forEach(focus => {
        //         this.market_buyingOrder(focus)
        //     })
        // }
        //
    // }

    // Room.prototype.init_mineralOrder = function(price: number) {
    //     if (this.memory.mineralOrder) {
    //         logConsole('STOP! We already have a order.')
    //         return
    //     }
    //     const mineralType = this.mineral()?.mineralType
    //     if (mineralType === undefined) {
    //         logConsole('STOP! We do not have a mineral.')
    //         return
    //     }
    //     const resp = Game.market.createOrder({
    //         type: ORDER_SELL,
    //         resourceType: mineralType,
    //         price: price,
    //         totalAmount: Setting.FOCUS_ORDER_AMOUNT_PER,
    //         roomName: this.name,
    //     })
    //     if (resp == OK) {
    //         this.memory.mineralOrder = {
    //             timeBegin: Game.time,
    //         }
    //     }
    //     else {
    //         logConsole(`Something Error: ${resp}`)
    //     }
    // }

    // Room.prototype.init_buyingOrder = function(price: number, resource: ResourceConstant, totalAmount: number) {
    //     if (this.memory.buyingOrder) {
    //         logConsole('STOP! We already have a order.')
    //         return
    //     }
    //     const resp = Game.market.createOrder({
    //         type: ORDER_BUY,
    //         resourceType: resource,
    //         price: price,
    //         totalAmount: Setting.FOCUS_ORDER_AMOUNT_PER,
    //         roomName: this.name,
    //     })
    //     if (resp == OK) {
    //         this.memory.buyingOrder = {
    //             timeBegin: Game.time,
    //             amountLimit: totalAmount,
    //         }
    //     }
    //     else {
    //         logConsole(`Something Error: ${resp}`)
    //     }
    // }
}
