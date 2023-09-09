import { SimpleRole } from "./SimpleRole";

export class Builder extends SimpleRole {
    public static get_name(): RoleString {
        return "builder";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, WORK, CARRY, CARRY, MOVE, MOVE]; // 400
    }
    public static find_target_id(creep: Creep): string | null {
        const target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
        if (target)
            return target.id;
        else
            return null;
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        const target = Game.getObjectById<ConstructionSite>(target_id);
        if (!target) return false;
        if (creep.build(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        const limit = rich ? 4 : 2;
        if (num >= limit) return false;
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        return sites.length > 0;
    }
}
