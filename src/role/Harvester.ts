import { SimpleRole } from "./SimpleRole";

export class Harvester extends SimpleRole {
    public static get_limit(): number {
        return 2;
    }
    public static get_name(): RoleString {
        return "harvester";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE];
    }
    public static find_target_id(creep: Creep): string | null {
        // 填满 container (没有 transfer 不能考虑)
        const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                obj.structureType == STRUCTURE_CONTAINER &&
                obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (container)
            return container.id;
        else
            return null;
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        const target = Game.getObjectById<StructureExtension | StructureSpawn>(target_id);
        if (!target) return false;
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }

    public static get_can_sleep(): boolean {
        // 完成任务了也要站在原地，不要离开工位
        return false;
    }
    public static work_source(creep: Creep): boolean {
        // 只挖 source
        const source = creep.pos.findClosestByPath(FIND_SOURCES);
        if (source) {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else
            return false;
        return creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0;
    }
}
