import { Setting } from "setting"

export function mountTerminal() {
    StructureTerminal.prototype.highEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.TERMINAL_ENERGY_HIGH
    }
    StructureTerminal.prototype.lowEnergy = function () {
        return this.store[RESOURCE_ENERGY] < Setting.TERMINAL_ENERGY_LOW
    }
    StructureTerminal.prototype.resourceToStorage = function () {
        const storage = this.room.storage
        if (this.highEnergy())
            return RESOURCE_ENERGY
        if (storage && storage.store[RESOURCE_ENERGY] < Setting.STORAGE_ENERGY_ALMOST_ZERO)
            return RESOURCE_ENERGY
        if (this.store[RESOURCE_POWER] > 0)
            return RESOURCE_POWER
        return undefined
    }
    StructureTerminal.prototype.resourceNeed = function () {
        const storage = this.room.storage
        if (!storage) return undefined
        if (this.store.getFreeCapacity() <= 30_000) return undefined
        const order = Object.values(Game.market.orders).find(o =>
            o.type == ORDER_SELL
            && o.roomName == this.room.name
            && o.resourceType != PIXEL
            && o.resourceType != CPU_UNLOCK
            && o.resourceType != ACCESS_KEY
            && o.resourceType != SUBSCRIPTION_TOKEN
            && this.store[o.resourceType] < o.remainingAmount
            && storage.store[o.resourceType] > 0
        )
        if (order === undefined) return undefined
        return order.resourceType as ResourceConstant
    }
    StructureTerminal.prototype.work = function () {
        // 送能量出去
        const ctrl = this.room.controller
        const storage = this.room.storage
        const rate = 0.1 // 可以容忍的消耗
        const localAmount = Math.floor(this.store[RESOURCE_ENERGY] / 2) // 本地能够发送的能量
        const amount = Math.floor(localAmount / (1 + rate)) // 实际发送出去的能量
        if (ctrl && ctrl.level == 8 && storage &&
            storage.store[RESOURCE_ENERGY] >= Setting.STORAGE_ENERGY_LOW + localAmount &&
            !this.lowEnergy() && Game.time % 100 <= 0
        ) {
            for (const otherRoomName in Game.rooms) {
                const otherRoom = Game.rooms[otherRoomName]
                const otherCtrl = otherRoom.myController()
                const otherTerm = otherRoom.terminal
                if (otherCtrl && otherCtrl.level < 8 &&
                    otherTerm && !otherTerm.highEnergy() &&
                    amount + Game.market.calcTransactionCost(amount, this.room.name, otherRoomName) <= localAmount
                ) {
                    this.send(RESOURCE_ENERGY, amount, otherRoom.name, `energy from ${this.room.name}`)
                    break
                }
            }
        }
    }
}

declare global {
    interface StructureTerminal {
        highEnergy(): boolean
        lowEnergy(): boolean
        resourceToStorage(): ResourceConstant | undefined
        resourceNeed(): ResourceConstant | undefined
        work(): void
    }
}
