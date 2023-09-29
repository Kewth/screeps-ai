import { collectorLogic } from "./advanced/collector";
import { fillerLogic } from "./advanced/filler";
import { builderLogic } from "./base/builder";
import { harvesterLogic } from "./base/harvester";
import { upgraderLogic } from "./base/upgrader";
import { remoteCarrierLogic } from "./remote/remoteCarrier";
import { remoteHarvesterLogic } from "./remote/remoteHarvester";
import { reserverLogic } from "./remote/reserver";
import { viewerLogic } from "./remote/viewer";

export const getRoleLogic: {
    [role in RoleConstant]: CreepLogic
} = {
    harvester: harvesterLogic,
    builder: builderLogic,
    upgrader: upgraderLogic,
    collector: collectorLogic,
    filler: fillerLogic,
    viewer: viewerLogic,
    reserver: reserverLogic,
    remoteHarvester: remoteHarvesterLogic,
    remoteCarrier: remoteCarrierLogic,
}

// 用于类型检查 (TODO: find a better solution)
// export function createData<T extends CreepData> (data: T): T { return data }

declare global {
    interface EmptyData { placeHolder?: boolean }
    type RoleConstant =
        "harvester" |
        "builder" |
        "upgrader" |
        "collector" |
        "filler" |
        "viewer" |
        "reserver" |
        "remoteHarvester" |
        "remoteCarrier"
    type CreepData =
        EmptyData |
        HarvesterData |
        BuilderData |
        UpgraderData |
        CollectorData |
        FillerData |
        ViewerData |
        ReserverData |
        RemoteHarvesterData |
        RemoteCarrierData
}
