import { CollectorData, collectorLogic } from "./advanced/collector";
import { FillerData, fillerLogic } from "./advanced/filler";
import { BuilderData, builderLogic } from "./base/builder";
import { HarvesterData, harvesterLogic } from "./base/harvester";
import { UpgraderData, upgraderLogic } from "./base/upgrader";

export const getRoleLogic: {
    [role in RoleConstant]: CreepLogic
} = {
    harvester: harvesterLogic,
    builder: builderLogic,
    upgrader: upgraderLogic,
    collector: collectorLogic,
    filler: fillerLogic,
}

declare global {
    type RoleConstant =
        "harvester" |
        "builder" |
        "upgrader" |
        "collector" |
        "filler"
    type CreepData =
        HarvesterData |
        BuilderData |
        UpgraderData |
        CollectorData |
        FillerData
}
