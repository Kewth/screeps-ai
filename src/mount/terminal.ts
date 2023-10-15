import { Setting } from "setting"

export function mountTerminal() {
    StructureTerminal.prototype.highEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.TERMINAL_ENERGY_HIGH
    }
    StructureTerminal.prototype.lowEnergy = function () {
        return this.store[RESOURCE_ENERGY] < Setting.TERMINAL_ENERGY_LOW
    }
    StructureTerminal.prototype.resourceToStorage = function () {
        if (this.highEnergy()) return RESOURCE_ENERGY
        return undefined
    }
    StructureTerminal.prototype.work = function () {
        // 送能量出去
        const ctrl = this.room.controller
        const storage = this.room.storage
        if (ctrl && ctrl.level == 8 && storage &&
            storage.store[RESOURCE_ENERGY] >= Setting.STORAGE_ENERGY_LOW &&
            !this.lowEnergy() && Game.time % 100 <= 0
        ) {
            for (const otherRoomName in Game.rooms) {
                const otherRoom = Game.rooms[otherRoomName]
                const otherCtrl = otherRoom.myController()
                const otherTerm = otherRoom.terminal
                const rate = 0.1 // 可以容忍的消耗
                const amount = Math.floor(this.store[RESOURCE_ENERGY] / (1 + rate))
                if (otherCtrl && otherCtrl.level < 8 &&
                    otherTerm && !otherTerm.highEnergy() &&
                    amount + Game.market.calcTransactionCost(amount, this.room.name, otherRoomName) <= this.store[RESOURCE_ENERGY]
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
        work(): void
    }
}
