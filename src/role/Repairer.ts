import { SimpleRole } from "./SimpleRole";

export class Repairer extends SimpleRole {
    public static get_name(): RoleString {
        return "repairer";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE]; // 200
    }
    public static find_target_id(creep: Creep): string | null {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                (obj.structureType == STRUCTURE_CONTAINER ||
                    obj.structureType == STRUCTURE_ROAD)
                && obj.hits < obj.hitsMax
        });
        if (target)
            return target.id;
        else
            return null;
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        const target = Game.getObjectById<AnyStructure>(target_id);
        if (!target) return false;
        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        if (num < 1) return true;
        const coe = rich ? 0.9 : 0.65;
        const targets = room.find(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                (obj.structureType == STRUCTURE_CONTAINER ||
                    obj.structureType == STRUCTURE_ROAD)
                && obj.hits < obj.hitsMax * coe
        });
        return targets.length > 0;
    }
}
