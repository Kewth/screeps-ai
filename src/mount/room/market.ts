import { ToN, compressResourceType, logConsole, logError, myMax, myMin } from "utils/other"

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
    const history = Game.market.getHistory(resource)
    for (let i = history.length - 2; i >= 0; i --) {
        const his = history[i]
        // 不太稳定的话顺延
        if (his.stddevPrice < his.avgPrice)
            return his.avgPrice
    }
    return undefined
}

function todayPrice (resource: ResourceConstant) {
    const history = Game.market.getHistory(resource)
    if (history.length < 1) return undefined
    const his = history[history.length - 1]
    if (his.stddevPrice >= his.avgPrice) return undefined // 不太稳定，舍弃
    return his.avgPrice
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
        let price = (order.type == ORDER_BUY) ? myMin([yp, tp]) : myMax([yp, tp])
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
}
