import { Setting } from "setting"

export function mountStorage() {
    StructureStorage.prototype.highEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.STORAGE_ENERGY_HIGH
    }
    StructureStorage.prototype.mediumHighEnergy = function () {
        return this.store[RESOURCE_ENERGY] > Setting.STORAGE_ENERGY_MEDIUM
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
        highEnergy(): boolean
        mediumHighEnergy(): boolean
        lowEnergy(): boolean
        almostNoEnergy(): boolean
    }
}
