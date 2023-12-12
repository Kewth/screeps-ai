import { Setting } from "setting"
import { logConsole, marketConst2resourceConst } from "utils/other"

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
        if (storage && storage.almostNoEnergy())
            return RESOURCE_ENERGY
        if (this.store[RESOURCE_POWER] > 0)
            return RESOURCE_POWER
        return undefined
    }
    StructureTerminal.prototype.resourceNeed = function () {
        const storage = this.room.storage
        if (!storage) return undefined
        if (this.store.getFreeCapacity() <= 30_000) return undefined
        // 需要卖出的资源及时搬到 terminal
        const order = Object.values(Game.market.orders).find(o => {
            const resourceConst = marketConst2resourceConst(o.resourceType)
            return resourceConst
                && o.type == ORDER_SELL
                && o.roomName == this.room.name
                && this.store[resourceConst] < o.remainingAmount
                && storage.store[resourceConst] > 0
        })
        if (order !== undefined) return order.resourceType as ResourceConstant
        // 房间里挖的资源定量存储到 terminal
        // const mineralType = this.room.mineral()?.mineralType
        // if (mineralType && this.store[mineralType] < Setting.FOCUS_ORDER_AMOUNT_PER * 10 && storage.store[mineralType] > 0)
        //     return mineralType
        return undefined
    }
    StructureTerminal.prototype.work = function () {
        // 送能量出去
        // NOTE: 为了避免低能量房间反复传的情况，仅允许高能量房间进行传输
        const ctrl = this.room.controller
        const storage = this.room.storage
        const rate = 0.1 // 可以容忍的消耗
        const localAmount = Math.floor(this.store[RESOURCE_ENERGY] / 2) // 本地能够使用的能量
        const amount = Math.floor(localAmount / (1 + rate)) // 实际能够发送出去的能量
        if (Game.time % 10 <= 0 &&
            ctrl && ctrl.level == 8 &&
            // storage && storage.store[RESOURCE_ENERGY] >= Setting.STORAGE_ENERGY_LOW + localAmount &&
            storage && storage.mediumHighEnergy() &&
            !this.lowEnergy()
        ) {
            for (const otherRoomName in Game.rooms) {
                const otherRoom = Game.rooms[otherRoomName]
                const otherCtrl = otherRoom.myController()
                if (!otherCtrl) return
                const otherTerm = otherRoom.terminal
                // logConsole(`test ${this.room.name} ${otherRoom.name}: ${otherRoom.storage?.lowEnergy()} ${otherTerm?.highEnergy()}`)
                if (otherRoom.storage && !otherRoom.storage.maybeEnoughEnergy() &&
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
