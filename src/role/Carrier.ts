import { SimpleRole } from "./SimpleRole";

export class Carrier extends SimpleRole {
    public static get_name(): RoleString {
        return "carrier";
    }
    public static get_body(): BodyPartConstant[] {
        return [CARRY, CARRY, CARRY, CARRY, MOVE]; // 250
    }
    public static find_target_id(creep: Creep): string | null {
        // 保证 spawn/extension
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (obj: AnyStructure) =>
                (obj.structureType == STRUCTURE_EXTENSION ||
                    obj.structureType == STRUCTURE_SPAWN) &&
                obj.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (target)
            return target.id;
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
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        return num < 1;
    }
}
