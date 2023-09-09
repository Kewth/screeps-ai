import { SimpleRole } from "./SimpleRole";

export class Repairer extends SimpleRole {
    public static get_limit(): number {
        return 1;
    }
    public static get_name(): RoleString {
        return "repairer";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE];
    }
    public static find_target_id(creep: Creep): string | null {
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (obj: AnyStructure) => obj.hits < obj.hitsMax
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
}
