import { ToN, logError } from "utils/other"

export function mountPowerCreep() {
    PowerCreep.prototype.work = function() {
        if (this.shard === undefined) return
        if (this.room === undefined) return
        // renew
        if (ToN(this.ticksToLive) < 300) {
            const powerSpawn = this.room.myPowerSpawn()
            if (!powerSpawn) { logError('not powerSpawn', this.name); return }
            if (this.renew(powerSpawn) == ERR_NOT_IN_RANGE)
                this.moveTo(powerSpawn)
            return
        }
        // prepare
        const ctrl = this.room.myController()
        if (!ctrl) { logError('not controller', this.name); return }
        if (!ctrl.isPowerEnabled) {
            if (this.enableRoom(ctrl) == ERR_NOT_IN_RANGE)
                this.moveTo(ctrl)
            return
        }
        // source
        if (this.store.getFreeCapacity() > 0) {
            this.usePower(PWR_GENERATE_OPS)
            return
        }
        // target
        const storage = this.room.storage
        if (storage) {
            if (this.transfer(storage, RESOURCE_OPS) == ERR_NOT_IN_RANGE)
                this.moveTo(storage)
            return
        }
    }
}

declare global {
    interface PowerCreep {
        work(): void
    }
}
