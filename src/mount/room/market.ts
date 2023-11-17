import { Setting } from "setting"
import { logConsole, logError, marketConst2resourceConst, myMax } from "utils/other"

export function mountMarket() {
    Room.prototype.market_buyingOrder = function(focus: FocusOrder) {
        if (!focus.id) {
            const order = Object.values(Game.market.orders).find(o =>
                o.roomName == this.name
                && o.type == ORDER_BUY
                && o.created === focus.timeBegin
            )
            if (!order) {
                logError('cannot find new buying order', this.name)
                return
            }
            focus.id = order.id
        }
        const order = Game.market.orders[focus.id]
        if (!order) return
        const resourceConst = marketConst2resourceConst(order.resourceType)
        if (resourceConst === undefined) return
        // 买完了
        if (order.remainingAmount <= 0) {
            if (focus.timeEnd === undefined) focus.timeEnd = Game.time
            const timeUsed = focus.timeEnd - focus.timeBegin
            // 限额到了
            if (focus.amountLimit !== undefined && order.totalAmount !== undefined && order.totalAmount >= focus.amountLimit) {
                focus.dead = true
                return
            }
            let remainTimeRatio = (Setting.FOCUS_ORDER_TIME_INTERVAL - timeUsed) / Setting.FOCUS_ORDER_TIME_INTERVAL
            if (remainTimeRatio < 0) remainTimeRatio = 0
            const newPrice = order.price * Math.pow(0.99, remainTimeRatio)
            const creditsNeed = newPrice * Setting.FOCUS_ORDER_AMOUNT_PER * 1.05
            // 没钱了，挂起
            if (creditsNeed > Game.market.credits * 0.3) {
            }
            else {
                // 降低购价并补货，新一轮监听
                Game.market.changeOrderPrice(order.id, newPrice)
                Game.market.extendOrder(order.id, Setting.FOCUS_ORDER_AMOUNT_PER)
                focus.timeBegin = Game.time + 1
                focus.timeEnd = undefined
            }
        }
        // 超时了
        else if (Game.time - focus.timeBegin > Setting.FOCUS_ORDER_TIME_INTERVAL) {
            // 提高购价不补货，新一轮监听
            const newPrice = order.price * 1.02
            Game.market.changeOrderPrice(order.id, newPrice)
            // Game.market.extendOrder(order.id, Setting.FOCUS_ORDER_AMOUNT_PER - order.remainingAmount)
            focus.timeBegin = Game.time + 1
            focus.timeEnd = undefined
        }
        else {
        }
    }

    Room.prototype.market_mineralOrder = function(focus: FocusOrder) {
        if (!focus.id) {
            const order = Object.values(Game.market.orders).find(o =>
                o.roomName == this.name
                && o.type == ORDER_SELL
                && o.created === focus.timeBegin
                && o.resourceType === this.mineral()?.mineralType
            )
            if (!order) {
                logError('cannot find new mineral order', this.name)
                return
            }
            focus.id = order.id
        }
        const order = Game.market.orders[focus.id]
        if (!order) return
        const resourceConst = marketConst2resourceConst(order.resourceType)
        if (resourceConst === undefined) return
        // 卖完了
        if (order.remainingAmount <= 0) {
            if (focus.timeEnd === undefined) focus.timeEnd = Game.time
            const timeUsed = focus.timeEnd - focus.timeBegin
            // 限额到了
            if (focus.amountLimit !== undefined && order.totalAmount !== undefined && order.totalAmount >= focus.amountLimit) {
                focus.dead = true
                return
            }
            let remainTimeRatio = (Setting.FOCUS_ORDER_TIME_INTERVAL - timeUsed) / Setting.FOCUS_ORDER_TIME_INTERVAL
            if (remainTimeRatio < 0) remainTimeRatio = 0
            // 终端资源不够，挂起
            const term = this.terminal
            if (!term || term.store[resourceConst] < Setting.FOCUS_ORDER_AMOUNT_PER) {
            }
            else {
                // 增加一点价格 (不超过 1%) 并补货，新一轮监听
                const newPrice = order.price * Math.pow(1.01, remainTimeRatio)
                Game.market.changeOrderPrice(order.id, newPrice)
                Game.market.extendOrder(order.id, Setting.FOCUS_ORDER_AMOUNT_PER)
                focus.timeBegin = Game.time + 1
                focus.timeEnd = undefined
            }
        }
        // 超时了
        else if (Game.time - focus.timeBegin > Setting.FOCUS_ORDER_TIME_INTERVAL) {
            // 降低一点价格不补货，新一轮监听
            const newPrice = order.price * 0.98
            Game.market.changeOrderPrice(order.id, newPrice)
            // Game.market.extendOrder(order.id, Setting.FOCUS_ORDER_AMOUNT_PER - order.remainingAmount)
            focus.timeBegin = Game.time + 1
            focus.timeEnd = undefined
        }
        else {
        }
    }

    Room.prototype.work_market = function() {
        if (this.memory.mineralOrder) {
            this.market_mineralOrder(this.memory.mineralOrder)
        }
        if (this.memory.buyingOrder) {
            this.market_buyingOrder(this.memory.buyingOrder)
        }
    }

    Room.prototype.init_mineralOrder = function(price: number) {
        if (this.memory.mineralOrder) {
            logConsole('STOP! We already have a order.')
            return
        }
        const mineralType = this.mineral()?.mineralType
        if (mineralType === undefined) {
            logConsole('STOP! We do not have a mineral.')
            return
        }
        const resp = Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: mineralType,
            price: price,
            totalAmount: Setting.FOCUS_ORDER_AMOUNT_PER,
            roomName: this.name,
        })
        if (resp == OK) {
            this.memory.mineralOrder = {
                timeBegin: Game.time,
            }
        }
        else {
            logConsole(`Something Error: ${resp}`)
        }
    }

    Room.prototype.init_buyingOrder = function(price: number, resource: ResourceConstant, totalAmount: number) {
        if (this.memory.buyingOrder) {
            logConsole('STOP! We already have a order.')
            return
        }
        const resp = Game.market.createOrder({
            type: ORDER_BUY,
            resourceType: resource,
            price: price,
            totalAmount: Setting.FOCUS_ORDER_AMOUNT_PER,
            roomName: this.name,
        })
        if (resp == OK) {
            this.memory.buyingOrder = {
                timeBegin: Game.time,
                amountLimit: totalAmount,
            }
        }
        else {
            logConsole(`Something Error: ${resp}`)
        }
    }
}
