import { SimpleRole } from "./SimpleRole";

export class Cleaner extends SimpleRole {
    public static get_name(): RoleString {
        return "cleaner";
    }
    public static get_body(): BodyPartConstant[] {
        return [CARRY, CARRY, MOVE];
    }
    public static find_target_id(creep: Creep): string | null {
        // 填满 container
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
        const target = Game.getObjectById<StructureContainer>(target_id);
        if (!target) return false;
        if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        return num < 1;
    }

    public static work_source(creep: Creep): boolean {
        const tombstone = creep.pos.findClosestByPath(FIND_TOMBSTONES, {
            filter: obj => obj.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        });
        if (tombstone) {
            if (creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ffffff' } });
                return false;
            } else {
                return true; // 只要拿到了就转走
            }
        } else {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0)
                return true;
            // 没坟墓挖了且空了就去睡觉
            const target = creep.pos.findClosestByPath(FIND_FLAGS, {
                filter: (flag: Flag) => flag.memory.is_sleep
            });
            if (target)
                creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
            return false;
        }
    }

}
