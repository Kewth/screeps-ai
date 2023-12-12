import { reSpawn } from "mount/room/spawn"
import { getRoleLogic } from "role"
import { Setting } from "setting"
import { ToN, anyStore, logConsole, logError, myFirst } from "utils/other"

export function mountCreep() {
    Creep.prototype.work = function() {
        if (this.spawning) {
            this.updateReadyUsedTime()
            return
        }
        if (this.sleeping()) {
            this.say(`摸鱼:${this.sleepRemain()}`, true)
            return
        }
        else {
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
        // 优先使用自己的 storage
        if (this.room.storage?.my && !this.room.storage.almostNoEnergy())
            return this.room.storage
        const enSource = this.memory.energySourceID && Game.getObjectById(this.memory.energySourceID)
        if (enSource && (enSource instanceof Resource || enSource.store[RESOURCE_ENERGY] >= 50)) return enSource
        const list = [
            ...this.room.commonContainers().filter(obj => obj.store[RESOURCE_ENERGY] >= 500),
            ...this.room.ruins().filter(obj => obj.store[RESOURCE_ENERGY] >= 500),
            ...this.room.dropResources().filter(obj => obj.resourceType == RESOURCE_ENERGY),
        ]
        // 最后考虑别人的 storage
        const res = this.pos.findClosestByRange(list) || this.room.storage
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


    Creep.prototype._move = Creep.prototype.move
    Creep.prototype.move = function(dir: DirectionConstant): CreepMoveReturnCode {
        this.memory.allowCross = undefined
        let toX = this.pos.x
        let toY = this.pos.y
        if (dir == LEFT || dir == BOTTOM_LEFT || dir == TOP_LEFT) toX --
        if (dir == RIGHT || dir == BOTTOM_RIGHT || dir == TOP_RIGHT) toX ++
        if (dir == TOP || dir == TOP_LEFT || dir == TOP_RIGHT) toY --
        if (dir == BOTTOM || dir == BOTTOM_LEFT || dir == BOTTOM_RIGHT) toY ++
        if (toX >= 0 && toY >= 0 && toX < 50 && toY < 50) {
            const toPos = new RoomPosition(toX, toY, this.pos.roomName)
            this._movePos = toPos
            // if (toPos.lookFor(LOOK_STRUCTURES).length > 0)
                // return OK
            const toCreep = myFirst(toPos.lookFor(LOOK_CREEPS)) || myFirst(toPos.lookFor(LOOK_POWER_CREEPS))
            if (toCreep && toCreep.memory.allowCross) {
                // logConsole(`${this.name} CROSS ${toCreep.name}`)
                switch (dir) {
                    case LEFT: { toCreep._move(RIGHT); break }
                    case RIGHT: { toCreep._move(LEFT); break }
                    case TOP: { toCreep._move(BOTTOM); break }
                    case BOTTOM: { toCreep._move(TOP); break }
                    case BOTTOM_LEFT: { toCreep._move(TOP_RIGHT); break }
                    case BOTTOM_RIGHT: { toCreep._move(TOP_LEFT); break }
                    case TOP_LEFT: { toCreep._move(BOTTOM_RIGHT); break }
                    case TOP_RIGHT: { toCreep._move(BOTTOM_LEFT); break }
                }
            }
        }
        return this._move(dir)
    }
    Creep.prototype.goTo = function(target: {pos: RoomPosition}) {
        return this.moveTo(target, {
            ignoreCreeps: true,
            costCallback: function(roomName, martrix) {
                // TODO: 可以优化 via memory
                const room = Game.rooms[roomName]
                if (room) {
                    for (const creep of room.myCreeps()) {
                        if (!creep.memory.allowCross)
                            martrix.set(creep.pos.x, creep.pos.y, 255)
                    }
                }
            }
        })
    }

    Creep.prototype.sleep = function(time: number) {
        // sleep 范围包括本 tick
        this.memory.sleepUntil = Game.time + time
        this.say(`摸鱼咯:${time}`, true)
        this.memory.allowCross = true // 会在下次移动的时候自动被修改为 undefined
    }
    Creep.prototype.sleepRemain = function() {
        const d = ToN(this.memory.sleepUntil) - Game.time
        return d > 0 ? d : 0
    }
    Creep.prototype.sleeping = function() {
        return this.sleepRemain() > 0
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
        findEnergySource(): StructureStorage | StructureContainer | Resource | Ruin | undefined
        gainAnyResourceFrom(from: Resource | TypeWithStore): ScreepsReturnCode
        gainResourceFrom(from: Resource | TypeWithStore, resourceType: ResourceConstant): ScreepsReturnCode
        getConfig(): CreepConfig
        _movePos: RoomPosition
        _move(target: DirectionConstant): CreepMoveReturnCode
        goTo(tar: {pos: RoomPosition}): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND
        sleep(time: number): void
        sleepRemain(): number
        sleeping(): boolean
    }
}
