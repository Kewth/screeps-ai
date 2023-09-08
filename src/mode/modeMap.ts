import { BasicMode } from "./BasicMode";
import { ModeBuildSite } from "./ModeBuildSite";
import { ModeGetEnergy } from "./ModeGetEnergy";
import { ModeStoreEnergy } from "./ModeStoreEnergy";
import { ModeUpgradeController } from "./ModeUpgradeController";

export function modeMap(mode: ModeString): typeof BasicMode {
    if (mode == "getEnergy") return ModeGetEnergy;
    if (mode == "storeEnergy") return ModeStoreEnergy;
    if (mode == "upgradeController") return ModeUpgradeController;
    if (mode == "buildSite") return ModeBuildSite;
    return BasicMode;
}
