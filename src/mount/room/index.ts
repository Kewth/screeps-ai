import { PrintTable, ToN, calcConfigName, isEnemy, isEnemyOrInvader, isEvil, isInvader, logConsole, logError, myFirst, strLim } from "utils/other"
import { mountLink } from "./link"
import { mountSpawn } from "./spawn"
import { creepApi } from "creepApi"
import { calcBodyCost, makeBody, parseGeneralBodyConf, unionBodyConf } from "utils/bodyConfig"
import { mountMarket } from "./market"
import { Setting } from "setting"

export default class RoomExtension extends Room {
    /**
     * 工作逻辑
     */
    public work() {
        // 检查入侵
        // const dangerousCreep = this.hostileCreeps().find(
        //     c => isEvil(c) && c.body.find(b => b.type === ATTACK || b.type === RANGED_ATTACK) !== undefined
        // )
        const invader = this.hostileCreeps().find(isInvader)
        const invaderCores = this.find(FIND_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_INVADER_CORE && obj.level >= 1
        })
        if (this.controller?.owner && isEnemy({ owner: this.controller.owner })) {
            // 设置 notSafeUntil
            this.memory.notSafeUntil = Game.time + 10_000
        }
        else if (invader || invaderCores.length > 0) {
            // 设置 notSafeUntil
            if (!this.memory.notSafeUntil || Game.time >= this.memory.notSafeUntil)
                this.memory.notSafeUntil = Game.time + 1505
        }
        else {
            // 复位 notSafeUntil
            delete this.memory.notSafeUntil
        }
        if (this.controller?.my) {
            // 检查统计
            // const statInterval = 3000
            // if (!this.memory.nowStat || Game.time >= this.memory.nowStat.time + statInterval)
                // this.stats(true)
            // 自动注册
            if (Game.time % 1000 <= 0)
                this.autoRegisterCreeps()
            // 画图
            if (global.visual)
                this.drawVisual()
            // 检查建造计划
            if (Game.time % 1000 <= 0)
                this.checkBuilding()
            // 紧急发布 filler 判定
            const filConfigName = calcConfigName(this.name, `fil`)
            if (Memory.creepConfigs[filConfigName] && !this.myCreeps().find(obj => obj.memory.role == 'filler')) {
                this.memory.noFillerTickCount ++
                if (this.memory.noFillerTickCount >= 100) {
                    creepApi.add<FillerData>(this.name, 'filler', `emergencyFILLER`,
                        { carry: 2, move: 1 }, { onlyOnce: true }, 1, creepApi.EMERGENCY_PRIORITY)
                    this.memory.noFillerTickCount = 0
                }
            } else
                this.memory.noFillerTickCount = 0
            // 紧急发布 harvester 判定
            const harConfigName = calcConfigName(this.name, `har0`)
            if (Memory.creepConfigs[harConfigName] && !this.myCreeps().find(obj => obj.memory.role == 'harvester')) {
                this.memory.noHarvesterTickCount ++
                if (this.memory.noHarvesterTickCount >= 200) {
                    creepApi.add<HarvesterData>(this.name, 'harvester', `emergencyHARVESTER`,
                        { work: 2, move: 1 }, { sourceID: this.sources()[0].id, onlyOnce: true }, 1, creepApi.EMERGENCY_PRIORITY)
                    this.memory.noHarvesterTickCount = 0
                }
            } else
                this.memory.noHarvesterTickCount = 0
            // tower 集中式逻辑
            this.work_tower()
            // link 集中式逻辑
            this.work_link()
            // spawn 集中式逻辑
            this.work_spawn()
            // terminal 逻辑
            this.terminal?.work()
            // power spawn 逻辑
            this.myPowerSpawn()?.work()
            // factory 逻辑
            this.myFactory()?.work()
            // market 逻辑
            this.work_market()
        }
    }

    /**
     * 在房间内添加视觉效果
     */
    private drawVisual() {
        if (this.memory.buildingPlans) {
            for (const pos in this.memory.buildingPlans) {
                const x = Number(pos) >> 6
                const y = Number(pos) & 63
                const type = this.memory.buildingPlans[pos]
                if (type === STRUCTURE_EXTENSION)
                    this.visual.text('🟠', x, y)
                if (type === STRUCTURE_TOWER)
                    this.visual.text('🗼', x, y, { font: 1.3 })
                if (type === STRUCTURE_STORAGE)
                    this.visual.text('🥡', x, y, { font: 1.3 })
            }
        }
        this.myConstructionSites().forEach(struct => {
            if (struct.structureType === STRUCTURE_ROAD)
                this.visual.text('🚧', struct.pos)
            if (struct.structureType === STRUCTURE_CONTAINER)
                this.visual.text('📦', struct.pos, { font: 1.3 })
        })
        this.commonContainers().forEach(c => this.visual.text('📤', c.pos, { font: 1.3 }))
        this.upgradeContainers().forEach(c => this.visual.text('📥', c.pos, { font: 1.3 }))
    }

    /**
     * 手动调用：添加一个建造计划，该计划会在满足条件的时候自动建造工地
     * @param type 建造类型或者 undefined 表示删除
     * @param x x 坐标
     * @param y y 坐标
     */
    private addBuilding(type: BuildableStructureConstant | undefined, x: number, y: number) {
        if (!this.memory.buildingPlans)
            this.memory.buildingPlans = {}
        if (type === undefined)
            delete this.memory.buildingPlans[x << 6 | y]
        else
            this.memory.buildingPlans[x << 6 | y] = type
    }

    /**
     * 周期调用：检查建造计划并尝试建造工地
     */
    private checkBuilding() {
        if (this.memory.buildingPlans) {
            for (const pos in this.memory.buildingPlans) {
                const x = Number(pos) >> 6
                const y = Number(pos) & 63
                const type = this.memory.buildingPlans[pos]
                new RoomPosition(x, y, this.name).createConstructionSite(type)
            }
        }
    }
}

// TODO: 缓存在没有值 (undefined) 的时候等同于没有缓存，不太合理
export function mountRoom() {
    mountLink()
    mountSpawn()
    mountMarket()

    Room.prototype.addSpawnTask = function(configName: string) {
        if (this.memory.spawnTaskList.includes(configName)) return ERR_NAME_EXISTS
        if (this.memory.hangSpawnTaskList.includes(configName)) return ERR_NAME_EXISTS
        this.memory.spawnTaskList.push(configName)
        return OK
    }
    Room.prototype.addHangSpawnTask = function(configName: string) {
        if (this.memory.spawnTaskList.includes(configName)) return ERR_NAME_EXISTS
        if (this.memory.hangSpawnTaskList.includes(configName)) return ERR_NAME_EXISTS
        this.memory.hangSpawnTaskList.push(configName)
        return OK
    }

    Room.prototype.registerBase = function() {
        // 注册 harvester
        let index = 0
        this.sources().forEach(source => {
            creepApi.add<HarvesterData>(this.name, 'harvester', `har${index}`, 'harvester', { sourceID: source.id }, 1,
                creepApi.HARVESER_PRIORITY)
            index++
        })
        // 注册 repairer
        creepApi.add<RepairerData>(this.name, 'repairer', `rep`, 'repairer', {}, 1)
        // 注册 upgrader
        creepApi.add<UpgraderData>(this.name, 'upgrader', `upg`, 'upgrader', {}, 1)
        // 注册 builder
        creepApi.add<BuilderData>(this.name, 'builder', `bui`, 'builder', {}, 1)
        // 注册 filler
        creepApi.add<FillerData>(this.name, 'filler', `fil`, 'filler', {}, 1, creepApi.FILLER_PRIORITY)
        // 清理
        this.structures().forEach(obj => {
            if (obj.structureType == STRUCTURE_EXTENSION && !obj.my)
                obj.destroy()
        })
        return OK
    }

    Room.prototype.registerClaimKeeper = function(roomName: string) {
        creepApi.add<ClaimKeeperData>(this.name, 'claimKeeper', `${roomName}_cKep`, 'claimKeeper', {
            targetRoomName: roomName
        }, 1)
        return OK
    }

    Room.prototype.registerRemoteSourceRoom = function(roomName: string) {
        // 注册 viewer
        creepApi.add<ViewerData>(this.name, 'viewer', `${roomName}_vie`, 'viewer', {
            targetRoomName: roomName
        }, 1, creepApi.VIEWER_PRIORITY)
        // 注册 reserver
        creepApi.add<ReserverData>(this.name, 'reserver', `${roomName}_res`, 'reserver', {
            targetRoomName: roomName
        }, 1)
        // 注册 remoteHarvester/remoteCarrier
        for (let i = 0; i < 2; i ++) { // 房间最多两个 source
            const workFlag = Game.flags[`${roomName}_source${i}`]
            const buildFlag = Game.flags[`${roomName}_container${i}`] || workFlag
            if (workFlag && buildFlag) {
                creepApi.add<RemoteHarvesterData>(this.name, 'remoteHarvester', `${roomName}_har${i}`, 'remoteHarvester', {
                    workFlagName: workFlag.name,
                    buildFlagName: buildFlag.name,
                }, 1)
                creepApi.add<RemoteCarrierData>(this.name, 'remoteCarrier', `${roomName}_car${i}`, 'remoteCarrier', {
                    containerFlagName: buildFlag.name,
                }, 1)
            }
        }
        return OK
    }

    Room.prototype.registerRemoteSourceKeeperRoom = function(roomName: string) {
        // 注册 viewer
        creepApi.add<ViewerData>(this.name, 'viewer', `${roomName}_vie`, 'viewer', {
            targetRoomName: roomName
        }, 1, creepApi.VIEWER_PRIORITY)
        let guardFlagNames: string[] = []
        // 注册 remoteHarvester/remoteCarrier
        for (let i = 0; i < 4; i ++) { // 房间最多四个 source
            const workFlag = Game.flags[`${roomName}_source${i}`]
            const buildFlag = Game.flags[`${roomName}_container${i}`] || workFlag
            const guardFlag = Game.flags[`${roomName}_sourceGuard${i}`]
            if (workFlag && buildFlag) {
                creepApi.add<RemoteHarvesterData>(this.name, 'remoteHarvester', `${roomName}_har${i}`, 'keeperHarvester', {
                    workFlagName: workFlag.name,
                    buildFlagName: buildFlag.name,
                }, 1)
                creepApi.add<RemoteCarrierData>(this.name, 'remoteCarrier', `${roomName}_car${i}`, 'remoteCarrier', {
                    containerFlagName: buildFlag.name,
                }, 1)
            }
            if (guardFlag) {
                guardFlag.memory.lairCheck = true
                guardFlagNames.push(guardFlag.name)
            }
        }
        // 注册 keeperAttacker
        if (guardFlagNames.length > 0) {
            if (this.controller && this.controller.level <= 6) {
                creepApi.add<KeeperAttackerData>(this.name, 'keeperAttacker', `${roomName}_att`, 'keeperAttacker', {
                    guardFlagNames: guardFlagNames
                }, 3, creepApi.KEEPERATTACKER_PRIORITY)
            }
            else {
                creepApi.add<KeeperAttackerData>(this.name, 'keeperAttacker', `${roomName}_att`, 'keeperSingleAttacker', {
                    guardFlagNames: guardFlagNames
                }, 1, creepApi.KEEPERATTACKER_PRIORITY)
            }
        }
        return OK
    }

    Room.prototype.registerNewRoom = function(roomName: string, numClaim: number,
        numTough: number, numHeal: number, numHelper: number) {
        // 注册 claimer
        const spawnFlag = Game.flags[`${roomName}_spawn`]
        if (numClaim === undefined) return ERR_INVALID_ARGS
        if (numTough === undefined) return ERR_INVALID_ARGS
        if (numHeal === undefined) return ERR_INVALID_ARGS
        if (spawnFlag) {
            creepApi.add<ClaimerData>(this.name, 'claimer', `${roomName}_claim`, {
                tough: numTough,
                heal: numHeal,
                claim: numClaim,
                move: numTough + numHeal + numClaim,
            }, {
                spawnFlagName: spawnFlag.name
            }, 1)
            creepApi.add<RemoteHelperData>(this.name, 'remoteHelper', `${roomName}_rHel`, 'remoteHelper', {
                targetRoomName: roomName,
            }, numHelper)
            logConsole('注册成功')
            return OK
        }
        else
            return ERR_NOT_FOUND
    }

    Room.prototype.attackRoom = function(roomName: string) {
        const wallFlag = Game.flags[`${roomName}_atkWall`]
        if (wallFlag) {
            creepApi.add<RoomAttackerData>(this.name, 'roomAttacker', `${roomName}_roomAtk`, {
                move: 18,
                ranged_attack: 12,
                heal: 20,
            }, {
                wallFlagName: wallFlag.name
            }, 6)
            logConsole('注册成功，开始战争！')
        }
        return OK
    }

    Room.prototype.autoRegisterCreeps = function() {
        const ctrl = this.myController()
        if (!ctrl) return
        // 注册基础爬爬
        if (!creepApi.has(this.name, 'har0'))
            this.registerBase()
        // 注册 collector
        if (this.storage && this.storage.my) {
            creepApi.add<CollectorData>(this.name, 'collector', `col`, 'collector', {}, 1, creepApi.COLLECTOR_PRIORITY)
        }
        // 注册 miner
        const extractor = this.myExtractor()
        if (extractor) {
            const mineral = extractor.pos.lookFor(LOOK_MINERALS)[0]
            if (mineral)
                creepApi.add<HarvesterData>(this.name, 'harvester', `min`, 'miner', { sourceID: mineral.id }, 1)
        }
        // 注册 linkTransfer
        const link = this.myCentralLink()
        const transFlag = Game.flags[`${this.name}_linkTrans`]
        if (link && transFlag) {
            creepApi.add<LinkTransferData>(this.name, 'linkTransfer', `lTra`, 'linkTransfer',
                { standFlagName: transFlag.name }, 1, creepApi.LINKTRANSFER_PRIORITY)
        }
        // 注册 extraUpgrader
        if (ctrl.level < 8) {
            if (this.storage?.my)
                creepApi.add<UpgraderData>(this.name, 'upgrader', `exUpg`, 'exUpgrader', { isExtra: true }, 2)
            else {
                // 没 storage 会判定 containers ，RCL 比较低，需要增加发布数量
                creepApi.add<UpgraderData>(this.name, 'upgrader', `exUpg`, 'exUpgrader', { isExtra: true }, 4)
            }
        }
    }

    Room.prototype.makeExBuilder = function(num: number = 1) {
        creepApi.add<BuilderData>(this.name, 'builder', `exBui`, 'builder' , { onlyOnce: true }, num)
        return OK
    }

    Room.prototype.makeEnergySender = function(roomName: string, num: number, sourceRoomName: string | undefined) {
        creepApi.add<EnergySenderData>(this.name, 'energySender', `${roomName}_enSen`, {
            move: 25,
            carry: 25,
        }, {
            sourceRoomName: sourceRoomName || this.name,
            targetRoomName: roomName,
        }, num)
        return OK
    }

    Room.prototype.makeViewer = function(roomName: string, tough: number = 0) {
        let move = tough
        if (move <= 0) move = 1
        creepApi.add<ViewerData>(this.name, 'viewer', `${roomName}_oVie`, {
            tough: tough,
            move: move,
        }, {
            onlyOnce: true,
            targetRoomName: roomName,
        },
        1, creepApi.VIEWER_PRIORITY)
        return OK
    }

    Room.prototype.makeReserver = function(roomName: string, tough: number = 0) {
        const claim = 1
        let move = tough + claim
        creepApi.add<ReserverData>(this.name, 'reserver', `${roomName}_oRes`, {
            tough: tough,
            move: move,
            claim: claim,
        }, {
            onlyOnce: true,
            targetRoomName: roomName,
        }, 1)
        return OK
    }

    Room.prototype.makeCoreAttacker = function(roomName: string, attack: number = 25) {
        creepApi.add<CoreAttackerData>(this.name, 'coreAttacker', `${roomName}_cAtt`, {
            move: attack,
            attack: attack,
        }, {
            onlyOnce: true,
            targetRoomName: roomName,
        }, 1)
        return OK
    }

    Room.prototype.makeHelper = function(roomName: string, num: number) {
        if (num === undefined) return ERR_INVALID_ARGS
        creepApi.add<RemoteHelperData>(this.name, 'remoteHelper', `${roomName}_rHel`, 'remoteHelper', {
            targetRoomName: roomName,
        }, num)
        return OK
    }

    // 在终端跟踪此房间孵化的 creeps
    Room.prototype.showCreeps = function() {
        const t = new PrintTable()
        t.add('Config Name')
        t.add('Role')
        t.add('Bodys')
        t.add('Body Cost')
        t.add('Body Count')
        t.add('Live / Num')
        t.add('CPU cost (new -> old)')
        t.newLine()
        for (const configName in Memory.creepConfigs) {
            const config = Memory.creepConfigs[configName]
            if (config.spawnRoomName == this.name) {
                const bodyConf = unionBodyConf(config.extraBodyConf,
                    parseGeneralBodyConf(config.gBodyConf, this.energyCapacityAvailable))
                const bodys = bodyConf ? makeBody(bodyConf) : []
                t.add(configName)
                t.add(config.role)
                t.add(bodyConf ? JSON.stringify(bodyConf) : 'UNDEFINED')
                t.add(`${calcBodyCost(bodys)}`)
                t.add(`${bodys.length}`)
                t.add(`${config.live}/${config.num}`)
                let str = ''
                config.recordCpuCost?.forEach(cpu => str = `${cpu.toFixed(2)}  ` + str)
                t.add(str)
                t.newLine()
            }
        }
        let str = t.toString()
        this.memory.spawnTaskList.sort((a, b) => Memory.creepConfigs[b].priority - Memory.creepConfigs[a].priority)
        str += `==========\n`
        str += `spawn energy: (${this.energyAvailable}/${this.energyCapacityAvailable})\n`
        str += `active spawn: ${this.getActiveSpawnConfigName()}\n`
        str += `spawnList: ${this.memory.spawnTaskList}\n`
        str += `hangList: ${this.memory.hangSpawnTaskList}\n`
        logConsole(str)
    }

    Room.prototype.addResourceTask = function(task: ResourceTask) {
        if (task.resourceType === undefined) return ERR_INVALID_ARGS
        if (task.amount === undefined) return ERR_INVALID_ARGS
        if (task.targetID === undefined) return ERR_INVALID_ARGS
        const old_task = this.memory.resourceTaskList.find(obj => obj.resourceType == task.resourceType && obj.targetID == task.targetID)
        if (old_task) {
            if (task.amount > old_task.amount)
                old_task.amount = task.amount
        }
        else
            this.memory.resourceTaskList.push(task)
        return OK
    }
    Room.prototype.getResourceTask = function() {
        const storage = this.storage
        if (!storage) return undefined
        this.memory.resourceTaskList = this.memory.resourceTaskList.filter(task => {
            const target = Game.getObjectById(task.targetID)
            return target && target.store[task.resourceType] < task.amount
        })
        return this.memory.resourceTaskList.find(task =>
            storage.store[task.resourceType] > 0
        )
        // while (this.memory.resourceTaskList.length > 0) {
        //     const task = this.memory.resourceTaskList[0]
        //     const target = Game.getObjectById(task.targetID)
        //     if (target && target.store[task.resourceType] < task.amount)
        //         return task
        //     this.memory.resourceTaskList.shift()
        // }
        // return undefined
    }


    Room.prototype.structures = function() {
        if (!this._structures)
            this._structures =  this.find(FIND_STRUCTURES)
        return this._structures
    }
    Room.prototype.myStructures = function() {
        if (!this._myStructures)
            this._myStructures =  this.find(FIND_MY_STRUCTURES)
        return this._myStructures
    }
    // Room.prototype.myExtensions = function() {
    //     if (!this._myExtensions) {
    //         this._myExtensions = this.myStructures().filter(
    //             obj => obj.structureType == STRUCTURE_EXTENSION
    //         ) as StructureExtension[]
    //     }
    //     return this._myExtensions
    // }
    Room.prototype.mySpawns = function() {
        if (!this._mySpawns)
            this._mySpawns = this.find(FIND_MY_SPAWNS)
        return this._mySpawns
    }
    Room.prototype.myPowerSpawn = function() {
        if (!this._myPowerSpawn)
            this._myPowerSpawn = this.myStructures().find(
                obj => obj.structureType == STRUCTURE_POWER_SPAWN
            ) as StructurePowerSpawn | undefined
        return this._myPowerSpawn
    }
    Room.prototype.myTowers = function() {
        if (!this._myTowers)
            this._myTowers = this.myStructures().filter(
                obj => obj.structureType == STRUCTURE_TOWER
            ) as StructureTower[]
        return this._myTowers
    }
    Room.prototype.myLinks = function() {
        if (!this._myLinks)
            this._myLinks = this.myStructures().filter(
                obj => obj.structureType == STRUCTURE_LINK
            ) as StructureLink[]
        return this._myLinks
    }
    Room.prototype.myRamparts = function() {
        if (!this._myRamparts)
            this._myRamparts = this.myStructures().filter(
                obj => obj.structureType == STRUCTURE_RAMPART
            ) as StructureRampart[]
        return this._myRamparts
    }
    Room.prototype.myExtractor = function() {
        if (!this._myExtractor)
            this._myExtractor = (this.find(FIND_MY_STRUCTURES, {
                filter: obj => obj.structureType == STRUCTURE_EXTRACTOR
            }) as StructureExtractor[])[0]
        return this._myExtractor
    }
    Room.prototype.sources = function() {
        if (!this._sources)
            this._sources = this.find(FIND_SOURCES)
        return this._sources
    }
    Room.prototype.myCreeps = function() {
        if (!this._myCreeps)
            this._myCreeps = this.find(FIND_MY_CREEPS)
        return this._myCreeps
    }
    Room.prototype.hostileCreeps = function() {
        if (!this._hostileCreeps)
            this._hostileCreeps = this.find(FIND_HOSTILE_CREEPS)
        return this._hostileCreeps
    }
    Room.prototype.evilCreeps = function() {
        if (!this._evilCreeps)
            this._evilCreeps = this.hostileCreeps().filter(isEvil)
        return this._evilCreeps
    }
    Room.prototype.enemyOrInvaderCreeps = function() {
        if (!this._enemyOrInvaderCreeps)
            this._enemyOrInvaderCreeps = this.hostileCreeps().filter(isEnemyOrInvader)
        return this._enemyOrInvaderCreeps
    }
    Room.prototype.dropResources = function() {
        if (!this._dropResources)
            this._dropResources = this.find(FIND_DROPPED_RESOURCES)
        return this._dropResources
    }
    Room.prototype.tombstones = function() {
        if (!this._tombstones)
            this._tombstones = this.find(FIND_TOMBSTONES)
        return this._tombstones
    }
    Room.prototype.allContainers = function() {
        if (!this._allContainers)
            this._allContainers = this.structures().filter(
                obj => obj.structureType == STRUCTURE_CONTAINER
            ) as StructureContainer[]
        return this._allContainers
    }
    Room.prototype.ruins = function() {
        if (!this._ruins)
            this._ruins = this.find(FIND_RUINS)
        return this._ruins
    }
    Room.prototype.roads = function() {
        if (!this._roads)
            this._roads = this.structures().filter(
                obj => obj.structureType == STRUCTURE_ROAD
            ) as StructureRoad[]
        return this._roads
    }
    Room.prototype.walls = function() {
        if (!this._walls)
            this._walls = this.structures().filter(
                obj => obj.structureType == STRUCTURE_WALL
            ) as StructureWall[]
        return this._walls
    }
    Room.prototype.myConstructionSites = function() {
        if (!this._myConstructionSites)
            this._myConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES)
        return this._myConstructionSites
    }

    Room.prototype.invaderCore = function() {
        const _cache = this.cache.invaderCoreID && Game.getObjectById(this.cache.invaderCoreID)
        if (_cache) return _cache
        const list = this.structures().filter(obj => obj.structureType == STRUCTURE_INVADER_CORE) as StructureInvaderCore[]
        const invaderCore = myFirst(list)
        this.cache.invaderCoreID = invaderCore?.id
        return invaderCore
    }
    Room.prototype.mineral = function() {
        const _cache = this.cache.mineralID && Game.getObjectById(this.cache.mineralID)
        if (_cache) return _cache
        const mineral = myFirst(this.find(FIND_MINERALS))
        this.cache.mineralID = mineral?.id
        return mineral
    }
    Room.prototype.myExtensions = function() {
        if (this.cache.myExtensionIDs && Game.time <= ToN(this.cache.myExtensionIDsUntil))
            return this.cache.myExtensionIDs.map(id => Game.getObjectById(id)).filter(obj => obj) as StructureExtension[]
        const myExtensions = this.myStructures().filter(
            obj => obj.structureType == STRUCTURE_EXTENSION
        ) as StructureExtension[]
        this.cache.myExtensionIDs = myExtensions.map(obj => obj.id)
        this.cache.myExtensionIDsUntil = Game.time + 100
        return myExtensions
    }
    // 结果可能会少，但很多时候并不重要
    Room.prototype.myFreeExtensionsRough = function() {
        if (this.cache.myFreeExtensionIDs) {
            const res = this.cache.myFreeExtensionIDs
                .map(id => Game.getObjectById(id))
                .filter(obj => obj && obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0) as StructureExtension[]
            this.cache.myFreeExtensionIDs = res.map(obj => obj.id)
            // WARNING: 只要找到了 5 个就不更新 cache
            if (res.length >= 5) return res
            // 在保证期限内不更新 cache
            if (Game.time <= ToN(this.cache.myFreeExtensionIDsUntil)) return res
        }
        // 更新 cache
        const res = this.myExtensions().filter(obj => obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        this.cache.myFreeExtensionIDs = res.map(obj => obj.id)
        this.cache.myFreeExtensionIDsUntil = Game.time + 10
        return res
    }
    Room.prototype.myFactory = function() {
        const _cache = this.cache.factoryID && Game.getObjectById(this.cache.factoryID)
        if (_cache) return _cache
        const factory = this.myStructures().find(obj => obj.structureType == STRUCTURE_FACTORY) as StructureFactory
        this.cache.factoryID = factory?.id
        return factory
    }

    Room.prototype.myController = function() {
        return (this.controller && this.controller.my) ? this.controller : undefined
    }
    Room.prototype.upgradeContainers = function() {
        const ctrl = this.myController()
        return ctrl ? ctrl.pos.findInRange(this.allContainers(), 3) : []
    }
    Room.prototype.commonContainers = function() {
        return this.allContainers().filter(obj => _.every(this.upgradeContainers(), u => obj.id != u.id))
    }

    Room.prototype.myCentralLink = function() {
        if (!this.memory.myCenteralLinkID || Game.time % 1000 > 0) {
            this.memory.myCenteralLinkID = undefined
            if (this.storage) {
                const link = this.storage.pos.findClosestByRange(this.myLinks())
                if (link && link.pos.inRangeTo(this.storage, 3))
                    this.memory.myCenteralLinkID = link.id
            }
        }
        return (this.memory.myCenteralLinkID && Game.getObjectById(this.memory.myCenteralLinkID)) || undefined
    }
    Room.prototype.myUpgradeLink = function() {
        if (!this.memory.myUpgradeLinkID || Game.time % 1000 > 0) {
            this.memory.myUpgradeLinkID = undefined
            const ctrl = this.myController()
            if (ctrl) {
                const link = ctrl.pos.findClosestByRange(this.myLinks())
                if (link && link.pos.inRangeTo(ctrl, 3))
                    this.memory.myUpgradeLinkID = link.id
            }
        }
        return (this.memory.myUpgradeLinkID && Game.getObjectById(this.memory.myUpgradeLinkID)) || undefined
    }

    Object.defineProperty(Room.prototype, 'cache', {
        get: function (this: Room): RoomCache {
            if (!global.cache.rooms[this.name])
                global.cache.rooms[this.name] = {}
            return global.cache.rooms[this.name]
        },
        configurable: true,
    })
}

declare global {
    interface Room {
        work(): void
        work_spawn(): void
        work_link(): void
        work_market(force?: boolean): void
        // getFocusWall(): StructureWall | undefined
        // stats(store: boolean): void
        // work_spawnCreep(): boolean

        addHangSpawnTask(configName: string): OK | ERR_NAME_EXISTS | ERR_INVALID_ARGS
        addSpawnTask(configName: string): OK | ERR_NAME_EXISTS | ERR_INVALID_ARGS
        getActiveSpawnConfigName(): string | undefined
        checkHangSpawnTasks(): void
        // getEnergySourceList(): energySourceType[]
        // getEnergyTargetList(): energyTargetType[]

        // market_mineralOrder(focus: FocusOrder): void
        // market_sellingOrder(focus: FocusOrder): boolean
        // market_buyingOrder(focus: FocusOrder): void
        // init_mineralOrder(price: number): void
        // init_buyingOrder(price: number, resource: ResourceConstant, totalAmount: number): void

        // 终端控制 creeps
        registerBase(): OK
        registerClaimKeeper(roomName: string): OK
        registerRemoteSourceRoom(roomName: string): OK
        registerRemoteSourceKeeperRoom(roomName: string): OK
        autoRegisterCreeps(): void
        registerNewRoom(roomName: string, numClaim: number, numTough: number, numHeal: number, numHelper: number): OK | ERR_INVALID_ARGS | ERR_NOT_FOUND
        attackRoom(roomName: string): OK
        makeExBuilder(num: number): OK
        makeEnergySender(roomName: string, num: number, sourceRoomName: string | undefined): OK
        makeViewer(roomName: string, tough?: number): OK
        makeReserver(roomName: string, tough?: number): OK
        makeCoreAttacker(roomName: string, attack?: number): OK
        makeHelper(roomName: string, num: number): OK | ERR_INVALID_ARGS
        showCreeps(): void

        // resource tasks
        addResourceTask(task: ResourceTask): OK | ERR_INVALID_ARGS
        getResourceTask(): ResourceTask | undefined

        // TODO: 实现 cache 缓存
        // tick 级别缓存
        structures(): AnyStructure[]
        _structures: AnyStructure[]
        myStructures(): OwnedStructure[]
        _myStructures: OwnedStructure[]
        mySpawns(): StructureSpawn[]
        _mySpawns: StructureSpawn[]
        myPowerSpawn(): StructurePowerSpawn | undefined
        _myPowerSpawn: StructurePowerSpawn | undefined
        // myExtensions(): StructureExtension[]
        // _myExtensions: StructureExtension[]
        myTowers(): StructureTower[]
        _myTowers: StructureTower[]
        myLinks(): StructureLink[]
        _myLinks: StructureLink[]
        myRamparts(): StructureRampart[]
        _myRamparts: StructureRampart[]
        sources(): Source[]
        _sources: Source[]
        // minerals(): Mineral[]
        // _minerals: Mineral[]
        myExtractor(): StructureExtractor | undefined
        _myExtractor: StructureExtractor | undefined
        myCreeps(): Creep[]
        _myCreeps: Creep[]
        hostileCreeps(): Creep[]
        _hostileCreeps: Creep[]
        evilCreeps(): Creep[]
        _evilCreeps: Creep[]
        enemyOrInvaderCreeps(): Creep[]
        _enemyOrInvaderCreeps: Creep[]
        dropResources(): Resource[]
        _dropResources: Resource[]
        tombstones(): Tombstone[]
        _tombstones: Tombstone[]
        allContainers(): StructureContainer[]
        _allContainers: StructureContainer[]
        ruins(): Ruin[]
        _ruins: Ruin[]
        roads(): StructureRoad[]
        _roads: StructureRoad[]
        walls(): StructureWall[]
        _walls: StructureWall[]
        myConstructionSites(): ConstructionSite[]
        _myConstructionSites: ConstructionSite[]
        // anyEnergySource(): StructureStorage | StructureContainer | Resource | undefined
        // _anyEnergySource: StructureStorage | StructureContainer | Resource | undefined

        // cache 级别缓存
        invaderCore(): StructureInvaderCore | undefined
        mineral(): Mineral | undefined
        myExtensions(): StructureExtension[]
        myFreeExtensionsRough(): StructureExtension[]
        myFactory(): StructureFactory | undefined

        // 其他
        myController(): StructureController | undefined
        upgradeContainers(): StructureContainer[]
        commonContainers(): StructureContainer[]

        // memory 级别缓存
        myCentralLink(): StructureLink | undefined
        myUpgradeLink(): StructureLink | undefined

        cache: RoomCache
    }
}
