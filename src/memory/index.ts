import { checkStatsMemory } from "./stats"

/* ===== CREEP ===== */
declare global {
    interface CreepMemory {
        // 角色名
        role: RoleConstant
        // creep 自己需要的数据
        data: CreepData
        // config 名
        configName: string
        // 从孵化开始到准备结束的用时，用于提前孵化
        readyUsedTime?: number
        // 是否已经重新孵化
        reSpawnAlready?: boolean
        // 是否完成 prepare stage
        ready?: boolean
        // 是否正在 target stage
        working?: boolean
        // 缓存 findEnergySource
        energySourceID?: Id<StructureContainer | Resource | StructureStorage | Ruin>
        // 是否站定
        // standing?: boolean
        // 是否允对穿
        // 设置为 false 表示强制禁止对穿
        allowCross?: boolean
        // 摸鱼
        sleepUntil?: number
        // cpu 消耗
        cpuCost: number
        // 远程寻路存储
        farPath?: string
        farPathStayTime?: number
    }
}

function checkCreepMemory() {
    // 在 spawn 保证了 memory 合法性
    return
}

/* ===== POWERCREEP ===== */
declare global {
    interface PowerCreepMemory {
        // 是否允对穿
        allowCross?: boolean
        // 移动目标
        targetRoomName: string
    }
}

function checkPowerCreepMemory() {
    // 在 spawn 保证了 memory 合法性
    return
}

/* ===== FLAG ===== */
declare global {
    interface FlagMemory {
        lairCheck?: boolean
        lairTick?: number
    }
}

function checkFlagMemory() {
}

/* ===== ROOM ===== */
declare global {
    interface ResourceTask {
        resourceType: ResourceConstant
        amount: number
        targetID: Id<StructureTerminal | StructurePowerSpawn>
    }
    interface FocusOrder {
        id?: string
        timeBegin: number
        timeEnd?: number
        amountPer: number
        amountLimit?: number
        resource: ResourceConstant
    }
    interface RoomMemory {
        spawnTaskList: string[]
        hangSpawnTaskList: string[]
        // energySourceLocks: { [id: Id<energySourceType>]: number }
        // energyTargetLocks: { [id: Id<energyTargetType>]: number }
        // transferSourceTaskList: TransferSourceTask[]
        // transferTargetTaskList: TransferTargetTask[]
        // 不安全的时间
        notSafeUntil?: number
        // 集中要刷的墙
        // focusWallID?: Id<StructureWall>
        // 中央 link
        myCenteralLinkID?: Id<StructureLink>
        // 升级 link
        myUpgradeLinkID?: Id<StructureLink>
        // filler 停摆的时间
        noFillerTickCount: number
        // harvester 停摆的时间
        noHarvesterTickCount: number
        // 需要 claim
        needClaim?: boolean
        // 资源搬运任务
        resourceTaskList: ResourceTask[]
        // 自动处理的订单
        // mineralOrder?: FocusOrder
        sellingOrderList?: FocusOrder[]
        buyingOrderList?: FocusOrder[]
        // upgrade block
        controllerBlockUntil?: number
        // 工厂相关
        factoryProduct?: RESOURCE_ENERGY | CommodityConstant
        factoryWorkCount?: number
        factoryPrepareList?: {type: ResourceConstant, amount: number}[]
        factoryWorking?: boolean
        factorySending?: boolean
        // 建造计划
        buildingPlans?: { [key: number]: BuildableStructureConstant }
    }
}

function checkRoomMemory() {
    // 不能直接访问全局 Memory !
    for (const name in Game.rooms) {
        if (!Game.rooms[name].memory.spawnTaskList)
            Game.rooms[name].memory.spawnTaskList = []
        if (!Game.rooms[name].memory.hangSpawnTaskList)
            Game.rooms[name].memory.hangSpawnTaskList = []
        if (!Game.rooms[name].memory.noFillerTickCount)
            Game.rooms[name].memory.noFillerTickCount = 0
        if (!Game.rooms[name].memory.resourceTaskList)
            Game.rooms[name].memory.resourceTaskList = []
        // if (!Game.rooms[name].memory.transferSourceTaskList)
        //     Game.rooms[name].memory.transferSourceTaskList = []
        // if (!Game.rooms[name].memory.transferTargetTaskList)
        //     Game.rooms[name].memory.transferTargetTaskList = []
    }
}

/* ===== GLOBAL ===== */
declare global {
    interface CreepConfig {
        spawnRoomName: string
        role: RoleConstant
        data: CreepData
        gBodyConf: GeneralBodyConfig
        num: number
        live: number
        priority: number
        updateLock?: boolean
        extraBodyConf?: BodyConfig
        // 统计用
        recordCpuCost?: number[]
    }
    interface Memory {
        creepConfigs: { [name: string]: CreepConfig }
        pixelActiveAmount: number
        pixelActiveTotalPrice: number
    }
}

export function checkMemory() {
    if (!Memory.creepConfigs) Memory.creepConfigs = {}
    if (!Memory.pixelActiveAmount) Memory.pixelActiveAmount = 0
    if (!Memory.pixelActiveTotalPrice) Memory.pixelActiveTotalPrice = 0
    if (Game.time % 20 == 0) {
        for (const configName in Memory.creepConfigs) {
            if (Memory.creepConfigs[configName].live <= 0 && Memory.creepConfigs[configName].num <= 0)
                delete Memory.creepConfigs[configName]
        }
    }
    checkStatsMemory()
    checkCreepMemory()
    checkPowerCreepMemory()
    checkFlagMemory()
    checkRoomMemory()
}
