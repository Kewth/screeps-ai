import { BasicMode } from "./BasicMode";

export class ModeUpgradeController extends BasicMode {
    public static run(creep: Creep): boolean {
        if (creep.room.controller) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.room.controller
                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            console.log('NO CONTROLLER');
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
}
