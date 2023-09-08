import { SimpleRole } from "./SimpleRole";

export class Upgrader extends SimpleRole {
    public static get_limit(): number {
        return 2;
    }
    public static get_name(): RoleString {
        return "upgrader";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE];
    }
    public static update_mode(creep: Creep): void {
    }
    public static next_mode(mode: ModeString): ModeString {
        if (mode == "sleep") return "getEnergy";
        if (mode == "getEnergy") return "upgradeController";
        if (mode == "upgradeController") return "getEnergy";
        return "sleep";
    }
}
export const ROLE_UPGRADER = 'upgrader';
