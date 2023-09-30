import { PrintTable, isEnemyOrInvader, isEvil, logConsole, logError, strLim } from "utils/other"
import { mountTower } from "./tower"
import { mountLink } from "./link"
import { mountSpawn } from "./spawn"
import { creepApi } from "creepApi"
import { calcBodyCost, makeBody, parseGeneralBodyConf } from "utils/bodyConfig"

// TODO: 集中式孵化改为分布式
export function mountRoom() {
    mountTower()
    mountLink()
    mountSpawn()

    Room.prototype.work = function() {
        // 检查入侵
        const invaders = this.find(FIND_HOSTILE_CREEPS, { filter: isEvil })
        const invaderCores = this.find(FIND_STRUCTURES, {
            filter: obj => obj.structureType == STRUCTURE_INVADER_CORE && obj.level >= 0
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
        if (this.controller?.my) {
            // 检查统计
            const statInterval = 3000
            if (!this.memory.nowStat || Game.time >= this.memory.nowStat.time + statInterval)
                this.stats(true)
            // 紧急发布 filler 判定
            if (this.storage && this.storage && !this.myCreeps().find(obj => obj.memory.role == 'filler')) {
                this.memory.noFillerTickCount ++
                if (this.memory.noFillerTickCount >= 100) {
                    creepApi.add<FillerData>(this.name, 'filler', 'emergencyFILLER',
                        { carry: 2, move: 1 }, { emergency: true }, 1, creepApi.EMERGENCY_PRIORITY)
                    this.memory.noFillerTickCount = 0
                }
            } else
                this.memory.noFillerTickCount = 0
            // tower 集中式逻辑
            this.work_tower()
            // link 集中式逻辑
            this.work_link()
            // spawn 集中式逻辑
            this.work_spawn()
        }
    }

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

    // Room.prototype.getEnergySourceList = function() {
    //     roomUpdateEnergyTransfer(this)
    //     return energySourceList[this.name]
    // }
    // Room.prototype.getEnergyTargetList = function() {
    //     roomUpdateEnergyTransfer(this)
    //     return energyTargetList[this.name]
    // }

    // Room.prototype.spawnEnergyLimit = function() {
    //     return this.spawns().length * 300 + this.extensions().length * 50
    // }

    Room.prototype.registerBase = function() {
        // 注册 harvester
        let index = 0
        this.sources().forEach(source => {
            creepApi.add<HarvesterData>(this.name, 'harvester', `har${index}`, 'harvester', { sourceID: source.id }, 1)
            index++
        })
        // 注册 repairer
        creepApi.add<RepairerData>(this.name, 'repairer', `rep`, 'repairer', {}, 1)
        // 注册 upgrader
        creepApi.add<UpgraderData>(this.name, 'upgrader', `upg`, 'upgrader', {}, 1)
        // 注册 builder
        creepApi.add<BuilderData>(this.name, 'builder', `bui`, 'builder', {}, 1)
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
        return OK
    }

    Room.prototype.registerCollector = function() {
        creepApi.add(this.name, 'collector', `col`, 'carrier', <CollectorData>{}, 1)
        return OK
    }
    Room.prototype.registerFiller = function() {
        creepApi.add(this.name, 'filler', `fil`, 'carrier', <FillerData>{}, 1, creepApi.FILLER_PRIORITY)
        return OK
    }
    Room.prototype.registerAdvanced = function() {
        this.registerFiller()
        this.registerCollector()
        return OK
    }

    // 在终端跟踪此房间孵化的 creeps
    Room.prototype.showCreeps = function() {
        const t = new PrintTable()
        t.add('Config Name')
        t.add('Role')
        t.add('Bodys')
        t.add('Body Cost')
        t.add('Live / Num')
        t.newLine()
        for (const configName in Memory.creepConfigs) {
            const config = Memory.creepConfigs[configName]
            if (config.spawnRoomName == this.name) {
                const bodyConf = parseGeneralBodyConf(config.gBodyConf, this.energyCapacityAvailable)
                const bodys = bodyConf ? makeBody(bodyConf) : []
                t.add(configName)
                t.add(config.role)
                t.add(JSON.stringify(bodyConf))
                t.add(`${calcBodyCost(bodys)}`)
                t.add(`${config.live}/${config.num}`)
                t.newLine()
            }
        }
        let str = t.toString()
        this.memory.spawnTaskList.sort((a, b) => Memory.creepConfigs[b].priority - Memory.creepConfigs[a].priority)
        str += `==========\n`
        str += `spawn energy: (${this.energyAvailable}/${this.energyCapacityAvailable})\n`
        str += `spawnList: ${this.memory.spawnTaskList}\n`
        str += `hangList: ${this.memory.hangSpawnTaskList}\n`
        logConsole(str)
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
    Room.prototype.myExtensions = function() {
        if (!this._myExtensions) {
            this._myExtensions = this.myStructures().filter(
                obj => obj.structureType == STRUCTURE_EXTENSION
            ) as StructureExtension[]
        }
        return this._myExtensions
    }
    Room.prototype.mySpawns = function() {
        if (!this._mySpawns)
            this._mySpawns = this.find(FIND_MY_SPAWNS)
        return this._mySpawns
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
    Room.prototype.containers = function() {
        if (!this._containers)
            this._containers = this.structures().filter(
                obj => obj.structureType == STRUCTURE_CONTAINER
            ) as StructureContainer[]
        return this._containers
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
    Room.prototype.anyEnergySource = function() {
        if (!this._anyEnergySource)
            this._anyEnergySource = this.storage ||
                this.containers().find(obj => obj.store[RESOURCE_ENERGY] > 500) ||
                this.dropResources().find(obj => obj.resourceType == RESOURCE_ENERGY)
        return this._anyEnergySource
    }

    Room.prototype.centralLink = function() {
        if (!this.memory.centeralLinkID || Game.time % 1000 > 0) {
            if (!this.storage) return undefined
            const centralLink = this.storage.pos.findClosestByPath(this.myLinks())
            if (!centralLink) return undefined
            this.memory.centeralLinkID = centralLink.id
        }
        return Game.getObjectById(this.memory.centeralLinkID) || undefined
    }
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

        addHangSpawnTask(configName: string): OK | ERR_NAME_EXISTS | ERR_INVALID_ARGS
        addSpawnTask(configName: string): OK | ERR_NAME_EXISTS | ERR_INVALID_ARGS
        getActiveSpawnConfigName(): string | undefined
        checkHangSpawnTasks(): void
        // getEnergySourceList(): energySourceType[]
        // getEnergyTargetList(): energyTargetType[]

        // 终端控制 creeps
        registerBase(): OK
        // registerRemoteRoom(): OK
        // registerReserver(): OK
        registerRemoteSourceRoom(roomName: string): OK
        registerRemoteSourceKeeperRoom(roomName: string): OK

        registerCollector(): OK
        registerFiller(): OK
        registerAdvanced(): OK
        showCreeps(): void

        // tick 级别缓存
        structures(): AnyStructure[]
        _structures: AnyStructure[]
        myStructures(): OwnedStructure[]
        _myStructures: OwnedStructure[]
        mySpawns(): StructureSpawn[]
        _mySpawns: StructureSpawn[]
        myExtensions(): StructureExtension[]
        _myExtensions: StructureExtension[]
        myTowers(): StructureTower[]
        _myTowers: StructureTower[]
        myLinks(): StructureLink[]
        _myLinks: StructureLink[]
        sources(): Source[]
        _sources: Source[]
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
        containers(): StructureContainer[]
        _containers: StructureContainer[]
        roads(): StructureRoad[]
        _roads: StructureRoad[]
        walls(): StructureWall[]
        _walls: StructureWall[]
        myConstructionSites(): ConstructionSite[]
        _myConstructionSites: ConstructionSite[]
        anyEnergySource(): StructureStorage | StructureContainer | Resource | undefined
        _anyEnergySource: StructureStorage | StructureContainer | Resource | undefined

        // memory 级别缓存
        centralLink(): StructureLink | undefined
    }
}
