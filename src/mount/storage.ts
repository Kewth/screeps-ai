import { Setting } from "setting"

export function mountStorage() {
    StructureStorage.prototype.highEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.STORAGE_ENERGY_HIGH
    }
    StructureStorage.prototype.mediumHighEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.STORAGE_ENERGY_MEDIUM
    }
    StructureStorage.prototype.maybeEnoughEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.STORAGE_ENERGY_MAYBE_ENOUGH
    }
    StructureStorage.prototype.lowEnergy = function () {
        return this.store[RESOURCE_ENERGY] < Setting.STORAGE_ENERGY_LOW
    }
    StructureStorage.prototype.almostNoEnergy = function () {
        return this.store[RESOURCE_ENERGY] < Setting.STORAGE_ENERGY_ALMOST_ZERO
    }
}

declare global {
    interface StructureStorage {
        // high: 能量过剩，转换为电池，单元功率最大
        highEnergy(): boolean
        // mediumHigh: 能量较高，可以向其他房间输送能量，单元功率较大
        mediumHighEnergy(): boolean
        // !mediumHigh: 电池解压
        // maybeEnough: 能量略高于 low，单元功率普通
        maybeEnoughEnergy(): boolean
        // !low: 其他房间向它输送能量，单元功率普通
        lowEnergy(): boolean
        // low: 能量过低，耗能单元停止工作
        almostNoEnergy(): boolean
    }
}
