import { logError } from "utils/other";
import { harvesterLogic } from "./harvester";
import { carrierLogic } from "./carrier";
import { repairerLogic } from "./repairer";
import { upgraderLogic } from "./upgrader";
import { farHarvesterLogic } from "./farHarvester";
import { farCarrierLogic } from "./farCarrier";
import { farResercerLogic } from "./farReserver";

const errorLogic: creepLogic = {
    prepare_stage: creep => {
        logError('error role prepare', creep.name)
        return false
    }
 }

export const getRoleLogic: {
    [role in RoleString]: creepLogic
} = {
    error_role: errorLogic,
    harvester: harvesterLogic,
    carrier: carrierLogic,
    repairer: repairerLogic,
    upgrader: upgraderLogic,
    farHarvester: farHarvesterLogic,
    farCarrier: farCarrierLogic,
    farReserver: farResercerLogic,
}

declare global {
    type RoleString = "error_role" |
        "harvester" |
        "carrier" |
        "repairer" |
        "upgrader" |
        "farHarvester" |
        "farCarrier" |
        "farReserver"
}
