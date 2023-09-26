import { addStat_spawn } from "memory/stats"
import { getRoleLogic } from "role"
import { maintainCreepList } from "setting"
import { calcTaskName, isInvader, logConsole, logError, newCreepName } from "utils/other"

// TODO: 集中式孵化改为分布式
export function mountRoom() {
    Room.prototype.work = function() {
        // 检查统计
        const statInterval = 3000
        if (!this.memory.nowStat || Game.time >= this.memory.nowStat.time + statInterval)
            this.stats(true)
        // 检查入侵
        const invaders = this.find(FIND_HOSTILE_CREEPS, { filter: isInvader })
        const invaderCores = this.find(FIND_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_INVADER_CORE && obj.level > 0
        })
        if (invaders.length > 0 || invaderCores.length > 0) {
            // 设置 invaderTime
            if (!this.memory.invaderTime)
                this.memory.invaderTime = Game.time
        } else {
            // 复位 invaderTime
            if (this.memory.invaderTime)
                this.memory.invaderTime = undefined
        }
        // tower 集中式逻辑
        this.work_tower()
        // link 集中式逻辑
        this.work_link()
        // spawn 集中式逻辑
        this.work_spawn()
    }

    Room.prototype.work_tower = function() {
        const towers = this.find(FIND_MY_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_TOWER
        }) as StructureTower[]
        // 集中攻击
        const enemys = this.find(FIND_HOSTILE_CREEPS, { filter: isInvader })
        if (enemys.length > 0) {
            const enemy = _.min(enemys, e => e.hits)
            towers.forEach(tower => tower.attack(enemy))
            return
        }
        // 维修
        let busy_tower_list: Id<StructureTower>[] = []
        // 维护刚建出来的 rampart
        this.find(FIND_MY_STRUCTURES, {
            filter: obj =>
                obj.structureType == STRUCTURE_RAMPART && obj.hits < 800
        }).forEach(rampart => {
            const free_tower = towers.find(t => !(t.id in busy_tower_list))
            if (free_tower) {
                busy_tower_list.push(free_tower.id)
                free_tower.repair(rampart)
            }
        })
        // 修复 tower 附近的建筑
        const brokens = this.find(FIND_STRUCTURES, {
            filter: obj =>
                (obj.structureType == STRUCTURE_CONTAINER ||
                    obj.structureType == STRUCTURE_ROAD) &&
                obj.hits < obj.hitsMax - 800
        })
        brokens.forEach(broken => {
            const free_towers = broken.pos.findInRange(towers, 5, {
                filter: (t: StructureTower) => !(t.id in busy_tower_list)
            })
            if (free_towers.length > 0) {
                const free_tower = free_towers[0]
                busy_tower_list.push(free_tower.id)
                free_tower.repair(broken)
            }
        })
    }

    Room.prototype.work_link = function() {
        const links = this.find(FIND_STRUCTURES, {
                filter: obj => obj.structureType == STRUCTURE_LINK
        }) as StructureLink[]
        if (!this.memory.centeralLinkID) {
            if (!this.storage) return
            const centralLink = this.storage.pos.findClosestByPath(links)
            if (!centralLink) return
            this.memory.centeralLinkID = centralLink.id
        }
        const centralLink = Game.getObjectById<StructureLink>(this.memory.centeralLinkID)
        if (!centralLink) return
        // 非中央 link
        const free_count = 200 // 自由调节的值
        let centralBusy: boolean = (centralLink.store[RESOURCE_ENERGY] > free_count)
        links.forEach(link => {
            if (link.id == this.memory.centeralLinkID) return
            if (!centralBusy && link.store.getUsedCapacity(RESOURCE_ENERGY) > free_count) {
                centralBusy = (link.transferEnergy(centralLink) == OK)
            }
            // link 建在要道上，回来的 creep 一定会经过，直接从过路者身上扒下来
            // const creeps = link.pos.findInRange(FIND_MY_CREEPS, 1, {
            //     filter: obj => obj.memory.allowLink
            // })
            // creeps.forEach(c => c.transfer(link, RESOURCE_ENERGY))
        })
    }

    Room.prototype.work_spawn = function() {
        const taskList = maintainCreepList.filter(
            task => {
                if (task.roomName != this.name) return false
                if (Memory.creepSpawningTaskLiveCount[calcTaskName(task)] >= task.num) return false
                const logic = getRoleLogic[task.memory.role]
                return !logic.needSpawn || logic.needSpawn(task)
            }
        )
        if (taskList.length <= 0) return
        const spawnList = this.find(FIND_MY_SPAWNS, {
            filter: (obj: StructureSpawn) => !obj.spawning
        })
        if (spawnList.length <= 0) return
        const task = taskList[0]
        const spawn = spawnList[0]
        let mem = task.memory
        mem.taskName = calcTaskName(task)
        const creepName = newCreepName(task.creepName)
        if (Memory.creeps[creepName]) {
            logError("Memory is not deleted before spawning", this.name)
            delete Memory.creeps[creepName]
        }
        if (spawn.spawnCreep(task.body, creepName, { memory: mem }) == OK) {
            logConsole(`${this.name} starts spawning ${creepName} @ ${Game.time}, queue: ${taskList.map(t => t.creepName)}`)
            addStat_spawn(task.body)
            if (!Memory.creepSpawningTaskLiveCount[mem.taskName])
                Memory.creepSpawningTaskLiveCount[mem.taskName] = 1
            else
                Memory.creepSpawningTaskLiveCount[mem.taskName] ++
        }
        // TODO: 一个 Tick 指定多个 Spawn
    }

    // Room.prototype.getFocusWall = function() {
    //     const id = this.memory.focusWallID
    //     const wall = id && Game.getObjectById<StructureWall>(id)
    //     return wall ? wall : undefined
    // }

    Room.prototype.stats = function(store: boolean) {
        // 统计
        const storageEnergy = this.storage ?
            this.storage.store.getUsedCapacity(RESOURCE_ENERGY) :
            0
        const RCLprogress = this.controller ?
            this.controller.progress :
            0
        // 输出
        const stat = this.memory.lastStat ? this.memory.lastStat : this.memory.nowStat
        if (stat) {
            const interval = Game.time - stat.time
            logConsole(
                `${this.name}-stats(${interval} ticks):` +
                ` storage/T=${(storageEnergy - stat.storageEnergy) / interval}` +
                ` upgrade/T=${(RCLprogress - stat.RCLprogress) / interval}`
            )
        }
        // 存储
        if (store) {
            this.memory.lastStat = this.memory.nowStat
            this.memory.nowStat = {
                time: Game.time,
                storageEnergy: storageEnergy,
                RCLprogress: RCLprogress,
            }
        }
    }

    // Room.prototype.getEnergySourceList = function() {
    //     roomUpdateEnergyTransfer(this)
    //     return energySourceList[this.name]
    // }
    // Room.prototype.getEnergyTargetList = function() {
    //     roomUpdateEnergyTransfer(this)
    //     return energyTargetList[this.name]
    // }
}

declare global {
    interface Room {
        work(): void
        work_tower(): void
        work_spawn(): void
        work_link(): void
        // getFocusWall(): StructureWall | undefined
        stats(store: boolean): void
        // work_spawnCreep(): boolean
        // addSpawnTask(): void
        // getEnergySourceList(): energySourceType[]
        // getEnergyTargetList(): energyTargetType[]
    }
}
