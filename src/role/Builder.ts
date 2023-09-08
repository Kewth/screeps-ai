import { SimpleRole } from "./SimpleRole";

export class Builder extends SimpleRole {
    public static get_limit(): number {
        return 2;
    }
    public static get_name(): RoleString {
        return "builder";
    }
    public static get_body(): BodyPartConstant[] {
        return [WORK, CARRY, MOVE];
    }
    public static update_mode(creep: Creep): void {
    }
    public static next_mode(mode: ModeString): ModeString {
        if (mode == "sleep") return "getEnergy";
        if (mode == "getEnergy") return "buildSite";
        if (mode == "buildSite") return "getEnergy";
        return "sleep";
    }
}
export const ROLE_HARVERSTER = 'harverster';
