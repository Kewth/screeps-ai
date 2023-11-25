import { ToN, logConsole, logError } from "utils/other"

export function mountPowerCreep() {
    PowerCreep.prototype.work = function() {
        if (this.shard === undefined) return
        if (this.room === undefined) return
        this.memory.isSleep = true
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
        // use power
        const toPos = this.work_usePower()
        if (toPos) this.moveTo(toPos)
        else {
            // transfer ops
            if (this.store.getFreeCapacity() <= 50) {
                const storage = this.room.storage
                if (storage && this.transfer(storage, RESOURCE_OPS) == ERR_NOT_IN_RANGE)
                    this.moveTo(storage)
            }
        }
    }

    PowerCreep.prototype.work_usePower = function() {
        if (this.room === undefined) return undefined
        if (this.usePower(PWR_GENERATE_OPS) == OK) return undefined
        const source = this.room.sources().find(s => !s.effects || s.effects.length <= 0)
        if (source) {
            const resp = this.usePower(PWR_REGEN_SOURCE, source)
            if (resp == OK) return undefined
            if (resp == ERR_NOT_IN_RANGE) return source.pos
        }
        return undefined
    }

    // PowerCreep.move 内部在调用 Creep.move
    PowerCreep.prototype._move = function(dir: DirectionConstant) {
        return Creep.prototype._move.call(this, dir)
    }
}

declare global {
    interface PowerCreep {
        work(): void
        work_usePower(): RoomPosition | undefined
        _move(dir: DirectionConstant): CreepMoveReturnCode
    }
}
