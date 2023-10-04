import { ToN, logError } from "./other"

export function makeBody(b: BodyConfig): BodyPartConstant[] {
    let res: BodyPartConstant[] = []
    let parts = _.sum(_.values(b))
    if (parts > 50) {
        logError(`body too large ${parts}/50`, 'makeBody')
    }
    let move = b.move ? b.move : 0
    let tough = b.tough ? b.tough : 0
    const moveTick = Math.ceil((parts - move) / move)
    const moveAsTough = Math.floor(tough / moveTick)
    for (let i = 0; i < tough; i++) res.push(TOUGH)
    for (let i = 0; i < moveAsTough; i++) res.push(MOVE)
    if (b.work) for (let i = 0; i < b.work; i++) res.push(WORK)
    if (b.carry) for (let i = 0; i < b.carry; i++) res.push(CARRY)
    if (b.claim) for (let i = 0; i < b.claim; i++) res.push(CLAIM)
    for (let i = 0; i < move - moveAsTough; i++) res.push(MOVE)
    if (b.attack) for (let i = 0; i < b.attack; i++) res.push(ATTACK)
    if (b.ranged_attack) for (let i = 0; i < b.ranged_attack; i++) res.push(RANGED_ATTACK)
    if (b.heal) for (let i = 0; i < b.heal; i++) res.push(HEAL)
    return res
}

// export function calcBodyConfCost(b: BodyConfig): number {
//     let res = 0
//     if (b.tough) res += 10 * b.tough
//     if (b.carry) res += 50 * b.carry
//     if (b.work) res += 100 * b.work
//     if (b.move) res += 50 * b.move
//     if (b.claim) res += 600 * b.claim
//     if (b.attack) res += 80 * b.attack
//     if (b.ranged_attack) res += 150 * b.ranged_attack
//     if (b.heal) res += 250 * b.heal
//     return res
// }

export function calcBodyCost(b: BodyPartConstant[]): number {
    return _.sum(b, x => BODYPART_COST[x])
}

// RCL 1: 300
// RCL 2: 550
// RCL 3: 800
// RCL 4: 1300
// RCL 5: 1800
// RCL 6: 2300
// RCL 7: 5600
// RCL 8: 12900

const getBodyConfigByAuto: {
    [name in AutoBodyConstant]: (energy: number) => BodyConfig | undefined
} = {
    harvester: energy => {
        // 5 个 work 刚好满效率采矿
        if (energy >= 600) return { work: 5, carry: 1, move: 1 } // RCL 3
        if (energy >= 500) return { work: 4, carry: 1, move: 1 } // RCL 2
        if (energy >= 250) return { work: 2, carry: 1, move: 1 } // RCL 1
        return undefined
    },
    repairer: energy => {
        if (energy >= 1000) return { work: 5, carry: 5, move: 5 } // RCL 4
        if (energy >= 650) return { work: 4, carry: 2, move: 3 } // RCL 3
        if (energy >= 400) return { work: 2, carry: 2, move: 2 } // RCL 2
        if (energy >= 250) return { work: 1, carry: 1, move: 2 } // RCL 1
        return undefined
    },
    upgrader: energy => {
        if (energy >= 850) return { work: 5, carry: 3, move: 4 } // RCL 4
        if (energy >= 800) return { work: 5, carry: 2, move: 4 } // RCL 3
        if (energy >= 550) return { work: 3, carry: 2, move: 3 } // RCL 2
        if (energy >= 250) return { work: 1, carry: 1, move: 2 } // RCL 1
        return undefined
    },
    builder: energy => {
        if (energy >= 3000) return { work: 15, carry: 15, move: 15 } // RCL 7
        if (energy >= 1700) return { work: 10, carry: 6, move: 8 } // RCL 5
        if (energy >= 1300) return { work: 8, carry: 4, move: 6 } // RCL 4
        if (energy >= 800) return { work: 5, carry: 2, move: 4 } // RCL 3
        if (energy >= 400) return { work: 2, carry: 2, move: 2 } // RCL 2
        if (energy >= 250) return { work: 1, carry: 1, move: 2 } // RCL 1
        return undefined
    },
    collector: energy => {
        if (energy >= 900) return { carry: 8, move: 6 } // RCL 4
        return undefined
    },
    filler: energy => {
        // filler 配置高很容易停摆 (这个问题可能会在未来妥善解决)
        if (energy >= 2300) return { carry: 20, move: 10 } // RCL 6, cost 1500
        if (energy >= 1300) return { carry: 12, move: 6 } // RCL 4, cost 900
        if (energy >= 800) return { carry: 8, move: 4 } // RCL 3, cost 600
        if (energy >= 550) return { carry: 4, move: 2 } // RCL 2, cost 300
        if (energy >= 300) return { carry: 1, move: 1 } // RCL 1, cost 100
        return undefined
    },
    viewer: energy => {
        if (energy >= 60) return { tough: 1, move: 1 }
        return undefined
    },
    reserver: energy => {
        if (energy >= 1300) return { claim: 2, move: 2 } // RCL 4
        return undefined
    },
    remoteHarvester: energy => {
        if (energy >= 950) return { work: 7, carry: 1, move: 4 } // RCL 4
        if (energy >= 700) return { work: 5, carry: 1, move: 3 } // RCL 3
        return undefined
    },
    remoteCarrier: energy => {
        // NOTE: 需要预留 15 个 part 给 extra
        // if (energy >= 1700) return { work: 1, carry: 21, move: 11 } // RCL 5
        if (energy >= 1400) return { work: 1, carry: 17, move: 9 } // RCL 5
        if (energy >= 950) return { work: 1, carry: 11, move: 6 } // RCL 4
        return undefined
    },
    keeperHarvester: energy => {
        if (energy >= 1200) return { work: 9, carry: 1, move: 5 } // RCL 4
        return undefined
    },
    keeperAttacker: energy => {
        if (energy >= 2080) return { tough: 3, ranged_attack: 5, heal: 4, move: 6 } // RCL 6
        return undefined
    },
    keeperSingleAttacker: energy => {
        if (energy >= 4330) return { tough: 3, ranged_attack: 10, heal: 9, move: 11 } // RCL 7
        return undefined
    },
    exUpgrader: energy => {
        if (energy >= 4000) return { work: 30, carry: 10, move: 10} // RCL 7
        if (energy >= 550) return { work: 3, carry: 2, move: 3} // RCL 2
        return undefined
    },
    miner: energy => {
        if (energy >= 4000) return { work: 35, carry: 1, move: 9 } // RCL 7
        return undefined
    },
    linkTransfer: energy => {
        // 注意 link 的容量只有 800
        if (energy >= 2300) return { carry: 8, move: 4 } // RCL 6, cost 600
        return undefined
    }
}

export function parseGeneralBodyConf (g: GeneralBodyConfig, e: number): BodyConfig | undefined {
    return typeof g === 'string' ? getBodyConfigByAuto[g](e) : g
}

export function unionBodyConf (a: BodyConfig | undefined, b: BodyConfig | undefined): BodyConfig | undefined {
    if (!a) return b
    if (!b) return a
    const c: BodyConfig = {}
    BODYPARTS_ALL.forEach(key => {
        if (a[key] || b[key]) c[key] = ToN(a[key]) + ToN(b[key])
    })
    return c
}

declare global {
    type AutoBodyConstant =
        "harvester" |
        "repairer" |
        "upgrader" |
        "builder" |
        "collector" |
        "filler" |
        "viewer" |
        "reserver" |
        "remoteHarvester" |
        "keeperHarvester" |
        "remoteCarrier" |
        "keeperAttacker" |
        "keeperSingleAttacker" |
        "exUpgrader" |
        "miner" |
        "linkTransfer"
    type BodyConfig = {
        [key in BodyPartConstant]?: number
    }
    type GeneralBodyConfig = AutoBodyConstant | BodyConfig
}
