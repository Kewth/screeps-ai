import { BasicMode } from "./BasicMode";

export class ModeGetEnergy extends BasicMode {
    public static run(creep: Creep): boolean {
        const sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
        return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
    }
}
