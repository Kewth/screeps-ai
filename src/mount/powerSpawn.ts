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
            // if (this.store[RESOURCE_ENERGY] <= 0 && storage && !storage.lowEnergy()) {
            //     this.room.addResourceTask({
            //         resourceType: RESOURCE_ENERGY,
            //         amount: this.store.getCapacity(RESOURCE_ENERGY) * 0.8,
            //         targetID: this.id,
            //     })
            // }
        }
        // 停一次是为了让 filler 能够释放出来，另外放慢一下速度减少能量消耗
        if (storage && this.store[RESOURCE_POWER] > 0) {
            if (storage.highEnergy())
                this.processPower()
            else if (storage.mediumHighEnergy())
                this.processPower()
            else if (!storage.lowEnergy())
                Game.time % 5 <= 0 && this.processPower()
        }
    }
}

declare global {
    interface StructurePowerSpawn {
        work(): void
    }
}
