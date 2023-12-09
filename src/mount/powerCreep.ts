import { ToN, logConsole, logError } from "utils/other"

export function mountPowerCreep() {
    PowerCreep.prototype.work = function() {
        if (this.shard === undefined) return
        if (this.room === undefined) return
        // renew (need PowerSpawn)
        if (ToN(this.ticksToLive) < 300) {
            const powerSpawn = this.room.myPowerSpawn()
            if (powerSpawn) {
                if (this.renew(powerSpawn) == ERR_NOT_IN_RANGE)
                    this.moveTo(powerSpawn)
                return
            }
            logError('no powerSpawn', this.name)
        }
        // move to target room
        if (this.memory.targetRoomName && !this.goToRoom(this.memory.targetRoomName)) return
        // prepare (need Controller)
        const ctrl = this.room.myController()
        if (!ctrl) { logError('no controller', this.name); return }
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
            else
                this.memory.allowCross = true
        }
    }

    PowerCreep.prototype.work_usePower = function() {
        if (this.room === undefined) return undefined
        if (this.usePower(PWR_GENERATE_OPS) == OK) return undefined
        const source = this.room.sources().find(s => {
            if (!s.effects) return false
            const effect = s.effects.find(e => e.effect == PWR_REGEN_SOURCE && e.ticksRemaining > 50)
            return !effect
        })
        if (source) {
            const resp = this.usePower(PWR_REGEN_SOURCE, source)
            if (resp == OK) return undefined
            if (resp == ERR_NOT_IN_RANGE) return source.pos
        }
        if (this.room.energyCapacityAvailable >= 12000 && this.room.storage
            && this.room.energyAvailable < 3000 && this.store[RESOURCE_OPS] >= 2
        ) {
            const resp = this.usePower(PWR_OPERATE_EXTENSION, this.room.storage)
            if (resp == OK) return undefined
            if (resp == ERR_NOT_IN_RANGE) return this.room.storage.pos
        }
        return undefined
    }

    PowerCreep.prototype.goToRoom = function(roomName: string) {
        return Creep.prototype.goToRoom.call(this, roomName)
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
        goToRoom(roomName: string): boolean
        _move(dir: DirectionConstant): CreepMoveReturnCode
    }
}
