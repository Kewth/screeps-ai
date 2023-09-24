import { logError } from "utils/other";
import { harvesterLogic } from "./harvester";
import { carrierLogic } from "./carrier";
import { repairerLogic } from "./repairer";
import { upgraderLogic } from "./upgrader";
import { farHarvesterLogic } from "./farHarvester";
import { farCarrierLogic } from "./farCarrier";
import { farResercerLogic } from "./farReserver";
import { farBuilderLogic } from "./farBuilder";
import { builderLogic } from "./builder";
import { extraUpgraderLogic } from "./extraUpgrader";
import { sourceKillerLogic } from "./sourceKiller";

const errorLogic: CreepLogic = {
    prepare_stage: creep => {
        logError('error role prepare', creep.name)
        return false
    }
 }

export const getRoleLogic: {
    [role in RoleString]: CreepLogic
} = {
    error_role: errorLogic,
    harvester: harvesterLogic,
    carrier: carrierLogic,
    repairer: repairerLogic,
    upgrader: upgraderLogic,
    extraUpgrader: extraUpgraderLogic,
    builder: builderLogic,
    farHarvester: farHarvesterLogic,
    farCarrier: farCarrierLogic,
    farReserver: farResercerLogic,
    farBuilder: farBuilderLogic,
    sourceKiller: sourceKillerLogic,
}

declare global {
    type RoleString = "error_role" |
        "harvester" |
        "carrier" |
        "repairer" |
        "upgrader" |
        "extraUpgrader" |
        "farHarvester" |
        "farCarrier" |
        "farReserver" |
        "farBuilder" |
        "builder" |
        "sourceKiller"
}
