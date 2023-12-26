import { reSpawn } from "mount/room/spawn"
import RoomPositionExtension from "mount/roomPosition"
import { getRoleLogic } from "role"
import { Setting } from "setting"
import { ToN, anyStore, logConsole, logError, myFirst } from "utils/other"

export default class CreepExtension extends Creep {
    /**
     * 工作逻辑
     */
    public work(): void {
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

    /**
     * 远离目标
     * @param pos
     * @returns
     */
    public moveAway(pos: RoomPosition) {
        let x = 2 * this.pos.x - pos.x
        let y = 2 * this.pos.y - pos.y
        if (x >= 50) x = 49
        if (y >= 50) y = 49
        if (x < 0) x = 0
        if (y < 0) y = 0
        return this.moveTo(x, y)
    }

    /**
     * 随机移动
     * @returns
     */
    public moveRandom() {
        const directions: DirectionConstant[] = [TOP, RIGHT, LEFT, BOTTOM, TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT]
        const direction = directions[Math.floor(Math.random() * directions.length)];
        return this.move(direction)
    }

    /**
     * 更新准备时间
     */
    public updateReadyUsedTime() {
        if (!this.memory.readyUsedTime || this.memory.readyUsedTime <= 0)
            this.memory.readyUsedTime = 0
        this.memory.readyUsedTime++
        if (this.memory.readyUsedTime > 200)
            this.memory.readyUsedTime = 200
    }

    private farPathSave (path: RoomPosition[]): void {
        const mem = this.memory
        mem.farPath = path.map(pos => pos.serialize()).join() + ','
    }

    private farPathGoal (): RoomPosition | undefined {
        const mem = this.memory
        if (!mem.farPath) return undefined
        const pos = new RoomPosition(25, 25, this.room.name)
        const index = mem.farPath.indexOf(',')
        return pos.deserializeFrom(mem.farPath.slice(0, index))
    }

    private farPathShift (): void {
        const mem = this.memory
        if (!mem.farPath) return
        const index = mem.farPath.indexOf(',')
        mem.farPath = mem.farPath.slice(index + 1)
    }

    /**
     * 远程寻路，尝试避开危险的房间
     */
    public goToRoom (targetRoomName: string) {
        const mem = this.memory
        if (this.room.name == targetRoomName) {
            delete mem.farPath
            delete mem.farPathStayTime
            return true
        }
        const goal = this.farPathGoal()
        if (goal && this.pos.isEqualTo(goal)) {
            this.farPathShift()
            delete mem.farPathStayTime
        }
        if (mem.farPath === undefined || (mem.farPathStayTime && mem.farPathStayTime >= 10)) {
            const pathRes = PathFinder.search(this.pos, { pos: new RoomPosition(25, 25, targetRoomName), range: 25 }, {
                maxOps: 4000,
                roomCallback: roomName => {
                    // 绕过不安全房间
                    const mem = Memory.rooms[roomName]
                    if (mem && mem.notSafeUntil && Game.time < mem.notSafeUntil)
                        return false
                    // 设置 costs
                    const costs = new PathFinder.CostMatrix
                    this.room.roads().forEach(road => {
                        costs.set(road.pos.x, road.pos.y, 1)
                    })
                    this.room.structures().forEach(struct => {
                        if (struct.structureType === STRUCTURE_ROAD)
                            costs.set(struct.pos.x, struct.pos.y, 1)
                        else if (struct.structureType !== STRUCTURE_CONTAINER &&
                            (struct.structureType !== STRUCTURE_RAMPART || !struct.my))
                            costs.set(struct.pos.x, struct.pos.y, 255)
                    })
                    return costs
                }
            })
            if (pathRes.incomplete)
                logError(`cannot find a complete path to ${targetRoomName}`, this.name)
            this.farPathSave(pathRes.path)
            delete mem.farPathStayTime
        }
        const newGoal = this.farPathGoal()
        newGoal && this.move(this.pos.getDirectionTo(newGoal))
        if (global.visual) {
            // if (mem.farPath) {
            //     const points = mem.farPath.split(',').map(
            //         s => RoomPositionExtension.deserialize(s)
            //     ).filter(pos => pos.roomName == this.room.name)
            //     this.room.visual.poly(points)
            // }
        }
        mem.farPathStayTime = ToN(mem.farPathStayTime) + 1
        return false
    }

    public goAwayHostileCreeps(): boolean {
        const hostileCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS, 5)
        if (hostileCreeps.length > 0) {
            // if (hostileCreeps.length > 1) logError("Too many hostileCreeps", this.name)
            this.moveAway(hostileCreeps[0].pos)
            return true
        }
        return false
    }

    public findEnergySource () {
        // 优先使用自己的 storage
        if (this.room.storage?.my && !this.room.storage.almostNoEnergy())
            return this.room.storage
        const enSource = this.memory.energySourceID && Game.getObjectById(this.memory.energySourceID)
        if (enSource && (enSource instanceof Resource
            ? enSource.amount >= 50
            : enSource.store[RESOURCE_ENERGY] >= 50)) return enSource
        const list = [
            ...this.room.commonContainers().filter(obj => obj.store[RESOURCE_ENERGY] >= 500),
            ...this.room.ruins().filter(obj => obj.store[RESOURCE_ENERGY] >= 500),
            ...this.room.dropResources().filter(obj => obj.resourceType == RESOURCE_ENERGY && obj.amount >= 200),
        ]
        // 最后考虑别人的 storage
        const res = this.pos.findClosestByRange(list) || this.room.storage
        this.memory.energySourceID = res?.id
        return res || undefined
    }

    public gainAnyResourceFrom (from: Resource | TypeWithStore) {
        if (from instanceof Resource)
            return this.pickup(from)
        if (from instanceof Creep)
            return ERR_INVALID_TARGET
        const resource = anyStore(from)
        return resource ? this.withdraw(from, resource) : ERR_NOT_ENOUGH_RESOURCES
    }

    public gainResourceFrom(from: Resource | TypeWithStore, resourceType: ResourceConstant) {
        if (from instanceof Resource)
            return resourceType == from.resourceType ? this.pickup(from) : ERR_NOT_ENOUGH_RESOURCES
        if (from instanceof Creep)
            return ERR_INVALID_TARGET
        return this.withdraw(from, resourceType)
    }

    public getConfig () {
        return Memory.creepConfigs[this.memory.configName]
    }


    public move (dir: DirectionConstant): CreepMoveReturnCode {
        if (this.memory.allowCross)
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

    public goTo (target: {pos: RoomPosition}) {
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

    public sleep (time: number) {
        // sleep 范围包括本 tick
        this.memory.sleepUntil = Game.time + time
        this.say(`摸鱼咯:${time}`, true)
        if (this.memory.allowCross === undefined)
            this.memory.allowCross = true // 会在下次移动的时候自动被修改为 undefined
    }

    public sleepRemain () {
        const d = ToN(this.memory.sleepUntil) - Game.time
        return d > 0 ? d : 0
    }

    public sleeping () {
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
