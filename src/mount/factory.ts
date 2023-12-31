import { Setting } from "setting"
import { ToN, compressResourceType } from "utils/other"

export function mountFactory() {
    StructureFactory.prototype.lowEnergy = function () {
        return this.store[RESOURCE_ENERGY] < Setting.FACTORY_ENERGY_LOW
    }
    StructureFactory.prototype.highEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.FACTORY_ENERGY_HIGH
    }
    StructureFactory.prototype.resourceToStorage = function () {
        if (this.highEnergy()) return RESOURCE_ENERGY
        const product = this.room.memory.factoryProduct
        if (product && product != RESOURCE_ENERGY)
            return this.store[product] > 0 && (this.store[product] > 1000 || this.room.memory.factorySending)
                ? product : undefined
        return undefined
    }
    StructureFactory.prototype.resourceNeed = function () {
        return this.room.memory.factoryPrepareList?.find(pre => this.store[pre.type] < pre.amount)?.type
    }
    StructureFactory.prototype.work = function () {
        const mem = this.room.memory
        // 产物运输
        if (mem.factorySending && mem.factoryProduct) {
            if (this.store[mem.factoryProduct] <= 0) {
                mem.factorySending = undefined
                mem.factoryProduct = undefined
            }
            return
        }
        // 制造产物
        if (mem.factoryWorking && mem.factoryProduct && mem.factoryWorkCount) {
            const resp = this.produce(mem.factoryProduct)
            if (resp == OK) mem.factoryWorkCount -= 1
            if (resp == ERR_NOT_ENOUGH_RESOURCES) mem.factoryWorkCount = 0
            if (mem.factoryWorkCount <= 0) {
                mem.factoryWorkCount = undefined
                mem.factoryWorking = undefined
                // 产物是能量的话跳过 sending
                mem.factorySending = (mem.factoryProduct != RESOURCE_ENERGY)
            }
            return
        }
        const storage = this.room.storage
        // 准备资源
        if (mem.factoryPrepareList) {
            // 检查一下要是准备不了了就取消，防止卡死
            if (Game.time % 10 <= 0 && _.any(mem.factoryPrepareList, pre =>
                ToN(storage?.store[pre.type]) + this.store[pre.type] < pre.amount
            )) {
                mem.factoryPrepareList = undefined
                mem.factoryWorkCount = undefined
                mem.factoryProduct = undefined
                return
            }
            // 检查是否准备完成
            if (_.all(mem.factoryPrepareList, pre => this.store[pre.type] >= pre.amount)) {
                mem.factoryPrepareList = undefined
                mem.factoryWorking = true
                return
            }
            return
        }
        // 检查工作内容
        if (Game.time % 5 <= 0) {
            const ctrl = this.room.myController()
            // 解压能量 50 battery -> 500 energy
            if (storage && !storage.mediumHighEnergy() && storage.store[RESOURCE_BATTERY] >= 10_000) {
                const count = 20
                mem.factoryProduct = RESOURCE_ENERGY
                mem.factoryPrepareList = [{type: RESOURCE_BATTERY, amount: 50 * count}]
                mem.factoryWorkCount = count
                return
            }
            // 压缩能量 600 energy -> 50 battery
            if (ctrl && ctrl.level >= 8 && storage?.highEnergy()) {
                const count = 10
                mem.factoryProduct = RESOURCE_BATTERY
                mem.factoryPrepareList = [{type: RESOURCE_ENERGY, amount: 600 * count}]
                mem.factoryWorkCount = count
                return
            }
            // 压缩矿产 500 mineral + 200 energy -> 100 product
            const mineralType = this.room.mineral()?.mineralType
            const compressType = mineralType ? compressResourceType(mineralType) : undefined
            if (mineralType && compressType && storage && (
                (storage.store[mineralType] > Setting.STORAGE_MINERAL_HIGH) ||
                (storage.store[mineralType] / storage.store[compressType] > 10)
            )) {
                const count = 10
                mem.factoryProduct = compressType
                mem.factoryPrepareList = [{type: mineralType, amount: 500 * count}, {type: RESOURCE_ENERGY, amount: 200 * count}]
                mem.factoryWorkCount = count
                return
            }
        }
    }
}

declare global {
    interface StructureFactory {
        lowEnergy(): boolean
        // 正常情况 highEnergy 只可能在解压电池的时候出现
        highEnergy(): boolean
        resourceToStorage(): ResourceConstant | undefined
        resourceNeed(): ResourceConstant | undefined
        work(): void
    }
}
