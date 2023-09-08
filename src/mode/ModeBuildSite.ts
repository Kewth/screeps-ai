import { BasicMode } from "./BasicMode";

export class ModeBuildSite extends BasicMode {
    public static run(creep: Creep): boolean {
        const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
        if (targets.length > 0) {
            const res = creep.build(targets[0]);
            if (res == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
}
