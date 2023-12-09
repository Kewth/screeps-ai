import { collectorLogic } from "./advanced/collector";
import { fillerLogic } from "./base/filler";
import { repairerLogic } from "./base/repairer";
import { harvesterLogic } from "./base/harvester";
import { upgraderLogic } from "./base/upgrader";
import { keeperAttackerLogic } from "./remote/keeperAttacker";
import { remoteCarrierLogic } from "./remote/remoteCarrier";
import { remoteHarvesterLogic } from "./remote/remoteHarvester";
import { reserverLogic } from "./remote/reserver";
import { viewerLogic } from "./remote/viewer";
import { builderLogic } from "./base/builder";
import { linkTransferLogic } from "./advanced/linkTransfer";
import { coreAttackerLogic } from "./remote/coreAttacker";
import { claimKeeperLogic } from "./remote/claimKeeper";
import { remoteHelperLogic } from "./remote/remoteHelper";
import { roomAttakerLogic } from "./war/roomAttacker";
import { claimerLogic } from "./remote/claimer";
import { energySenderLogic } from "./remote/energySender";

export const getRoleLogic: {
    [role in RoleConstant]: CreepLogic
} = {
    harvester: harvesterLogic,
    repairer: repairerLogic,
    upgrader: upgraderLogic,
    builder: builderLogic,
    collector: collectorLogic,
    filler: fillerLogic,
    viewer: viewerLogic,
    reserver: reserverLogic,
    remoteHarvester: remoteHarvesterLogic,
    remoteCarrier: remoteCarrierLogic,
    keeperAttacker: keeperAttackerLogic,
    linkTransfer: linkTransferLogic,
    coreAttacker: coreAttackerLogic,
    claimKeeper: claimKeeperLogic,
    remoteHelper: remoteHelperLogic,
    roomAttacker: roomAttakerLogic,
    claimer: claimerLogic,
    energySender: energySenderLogic,
}

// 用于类型检查 (TODO: find a better solution)
// export function createData<T extends CreepData> (data: T): T { return data }

declare global {
    interface EmptyData {
        onlyOnce?: boolean
        placeHolder?: boolean
    }
    type RoleConstant =
        "harvester" |
        "repairer" |
        "upgrader" |
        "builder" |
        "collector" |
        "filler" |
        "viewer" |
        "reserver" |
        "remoteHarvester" |
        "remoteCarrier" |
        "keeperAttacker" |
        "linkTransfer" |
        "coreAttacker" |
        "claimKeeper" |
        "remoteHelper" |
        "roomAttacker" |
        "claimer" |
        "energySender"
    type CreepData =
        EmptyData |
        HarvesterData |
        RepairerData |
        UpgraderData |
        BuilderData |
        CollectorData |
        FillerData |
        ViewerData |
        ReserverData |
        RemoteHarvesterData |
        RemoteCarrierData |
        KeeperAttackerData |
        LinkTransferData |
        CoreAttackerData |
        ClaimKeeperData |
        RemoteHelperData |
        RoomAttackerData |
        ClaimerData |
        EnergySenderData
}
