import { BasicMode } from "./BasicMode";

export class ModeStoreEnergy extends BasicMode {
    public static run(creep: Creep): boolean {
        var targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure: AnyStructure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if (targets.length > 0) {
            if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else
            return true;
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
}
