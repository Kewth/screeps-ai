import { Setting } from "setting"

export function mountPowerSpawn() {
    StructurePowerSpawn.prototype.work = function () {
        const storage = this.room.storage
        if (Game.time % 100 <= 0) {
            // if (this.store[RESOURCE_POWER] <= 0) {
            //     this.room.addResourceTask({
            //         resourceType: RESOURCE_POWER,
            //         amount: this.store.getCapacity(RESOURCE_POWER) * 0.8,
            //         targetID: this.id,
            //     })
            // }
            // if (this.store[RESOURCE_ENERGY] <= 0 && storage && storage.store[RESOURCE_ENERGY] >= Setting.STORAGE_ENERGY_LOW) {
            //     this.room.addResourceTask({
            //         resourceType: RESOURCE_ENERGY,
            //         amount: this.store.getCapacity(RESOURCE_ENERGY) * 0.8,
            //         targetID: this.id,
            //     })
            // }
        }
        if (storage && storage.store[RESOURCE_ENERGY] >= Setting.STORAGE_ENERGY_LOW)
            this.processPower()
    }
}

declare global {
    interface StructurePowerSpawn {
        work(): void
    }
}
