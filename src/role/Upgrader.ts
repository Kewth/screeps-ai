import { SimpleRole } from "./SimpleRole";

export class Upgrader extends SimpleRole {
    public static get_name(): RoleString {
        return "upgrader";
    }
    public static get_body(): BodyPartConstant[] {
        return [
            CARRY, CARRY, CARRY,
            WORK, WORK, WORK,
            MOVE]; // 500
    }
    public static find_target_id(creep: Creep): string | null {
        if (creep.room.controller)
            return creep.room.controller.id;
        else
            return null;
    }
    public static work_target(creep: Creep, target_id: string): boolean {
        const target = Game.getObjectById<StructureController>(target_id);
        if (!target) return false;
        if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0;
    }
    public static need_spawn(room: Room, num: number, rich: boolean): boolean {
        const limit = rich ? 6 : 1;
        return num < limit;
    }
}
