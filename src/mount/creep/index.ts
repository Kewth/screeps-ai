import { reSpawn } from "mount/room/spawn"
import { getRoleLogic } from "role"
import { anyStore, logConsole, logError } from "utils/other"

export function mountCreep() {
    Creep.prototype.work = function() {
        if (this.spawning) {
            this.updateReadyUsedTime()
            return
        }
        const logic = getRoleLogic[this.memory.role]
        // prepare 阶段
        if (!this.memory.ready) {
            if (!logic.prepare_stage || logic.prepare_stage(this)) {
                this.memory.ready = true
                // logConsole(`${this.name} is ready in ${this.memory.readyUsedTime} ticks`)
            }
            else {
                this.updateReadyUsedTime()
                return
            }
        }
        // source/target 阶段
        const changeStage = this.memory.working
            ? (!logic.target_stage || logic.target_stage(this))
            : (!logic.source_stage || logic.source_stage(this))
        if (changeStage) {
            this.memory.working = !this.memory.working
            const changeStageAgain = this.memory.working
                ? (!logic.target_stage || logic.target_stage(this))
                : (!logic.source_stage || logic.source_stage(this))
            if (changeStageAgain)
                logError('change stage twice a tick', this.name)
        }
        // 快死了提前孵化
        if (!this.memory.reSpawnAlready && this.memory.readyUsedTime && this.ticksToLive && this.ticksToLive < this.memory.readyUsedTime)
            reSpawn(this.memory)
    }

    Creep.prototype.moveAway = function(pos: RoomPosition) {
        // let dx = this.pos.x - pos.x
        // let dy = this.pos.y - pos.y
        // return this.moveTo(this.pos.x + dx, this.pos.y + dy)
        let x = 2 * this.pos.x - pos.x
        let y = 2 * this.pos.y - pos.y
        if (x >= 50) x = 49
        if (y >= 50) y = 49
        if (x < 0) x = 0
        if (y < 0) y = 0
        return this.moveTo(x, y)
    }

    Creep.prototype.moveRandom = function() {
        const directions: DirectionConstant[] = [TOP, RIGHT, LEFT, BOTTOM, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT]
        const direction = directions[Math.floor(Math.random() * directions.length)];
        return this.move(direction)
    }

    Creep.prototype.updateReadyUsedTime = function() {
        if (!this.memory.readyUsedTime || this.memory.readyUsedTime <= 0)
            this.memory.readyUsedTime = 0
        this.memory.readyUsedTime++
        if (this.memory.readyUsedTime > 200)
            this.memory.readyUsedTime = 200
    }

    // Creep.prototype.goToRoomByFlag = function(flagName: string | undefined) {
    //     const flag = flagName && Game.flags[flagName]
    //     if (!flag) {
    //         logError('no flag', this.name)
    //         return false
    //     }
    //     // 走到 flag 所在房间
    //     if (this.room != flag.room || this.atExit()) {
    //         this.moveTo(flag)
    //         return false
    //     }
    //     return true
    // }

    Creep.prototype.goToRoom = function(roomName: string) {
        if (this.room.name != roomName) {
            this.moveTo(new RoomPosition(25, 25, roomName))
            return false
        }
        return true
    }

    Creep.prototype.atExit = function() {
        return this.pos.x == 0 || this.pos.y == 0 || this.pos.x == 49 || this.pos.y == 49
    }

    Creep.prototype.goAwayHostileCreeps = function () {
        const hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 5)
        if (hostileCreeps.length > 0) {
            // if (hostileCreeps.length > 1) logError("Too many hostileCreeps", this.name)
            this.moveAway(hostileCreeps[0].pos)
            return true
        }
        return false
    }

    // Creep.prototype.getEnergy = function(with_priority: boolean) {
    //     let id = this.memory.energySourceID
    //     if (!id) {
    //         id = calcEnergySource(this, with_priority)
    //         if (!id) return
    //         this.room.memory.energySourceLocks[id]--
    //         this.memory.energySourceID = id
    //     }
    //     const source = Game.getObjectById(id)
    //     if (source && this.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
    //         this.moveTo(source)
    // }

    // Creep.prototype.releaseEnergySource = function() {
    //     if (this.memory.energySourceID) {
    //         this.room.memory.energySourceLocks[this.memory.energySourceID]--
    //         this.memory.energySourceID = undefined
    //     }
    // }

    Creep.prototype.findEnergySource = function() {
        if (this.room.storage && this.room.storage.store[RESOURCE_ENERGY] >= 5_000)
            return this.room.storage
        const enSource = this.memory.energySourceID && Game.getObjectById(this.memory.energySourceID)
        if (enSource && (enSource instanceof Resource || enSource.store[RESOURCE_ENERGY] >= 50)) return enSource
        const list = [
            ...this.room.commonContainers().filter(obj => obj.store[RESOURCE_ENERGY] >= 500),
            ...this.room.dropResources().filter(obj => obj.resourceType == RESOURCE_ENERGY)
        ]
        const res = this.pos.findClosestByPath(list)
        this.memory.energySourceID = res?.id
        return res || undefined
    }
    Creep.prototype.gainAnyResourceFrom = function(from: Resource | TypeWithStore) {
        if (from instanceof Resource)
            return this.pickup(from)
        if (from instanceof Creep)
            return ERR_INVALID_TARGET
        const resource = anyStore(from)
        return resource ? this.withdraw(from, resource) : ERR_NOT_ENOUGH_RESOURCES
    }
    Creep.prototype.gainResourceFrom = function(from: Resource | TypeWithStore, resourceType: ResourceConstant) {
        if (from instanceof Resource)
            return resourceType == from.resourceType ? this.pickup(from) : ERR_NOT_ENOUGH_RESOURCES
        if (from instanceof Creep)
            return ERR_INVALID_TARGET
        return this.withdraw(from, resourceType)
    }

    Creep.prototype.getConfig = function() {
        return Memory.creepConfigs[this.memory.configName]
    }
}

declare global {
    interface Creep {
        work(): void
        moveAway(pos: RoomPosition): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET
        moveRandom(): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET
        updateReadyUsedTime(): void
        // getEnergy(with_priority: boolean): void
        // releaseEnergySource(): void
        // goToRoomByFlag(flagName: string | undefined): boolean
        goToRoom(roomName: string): boolean
        atExit(): boolean
        goAwayHostileCreeps(): boolean
        findEnergySource(): StructureStorage | StructureContainer | Resource | undefined
        gainAnyResourceFrom(from: Resource | TypeWithStore): ScreepsReturnCode
        gainResourceFrom(from: Resource | TypeWithStore, resourceType: ResourceConstant): ScreepsReturnCode
        getConfig(): CreepConfig
    }
}
