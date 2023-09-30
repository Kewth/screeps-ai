export function makeBody(b: BodyConfig): BodyPartConstant[] {
    let res: BodyPartConstant[] = []
    if (b.tough) for (let i = 0; i < b.tough; i++) res.push(TOUGH)
    if (b.carry) for (let i = 0; i < b.carry; i++) res.push(CARRY)
    if (b.work) for (let i = 0; i < b.work; i++) res.push(WORK)
    if (b.move) for (let i = 0; i < b.move; i++) res.push(MOVE)
    if (b.claim) for (let i = 0; i < b.claim; i++) res.push(CLAIM)
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
    return _.sum(b, x => {
        switch(x) {
            case TOUGH: return 10
            case CARRY: return 50
            case WORK: return 100
            case MOVE: return 50
            case CLAIM: return 600
            case ATTACK: return 80
            case RANGED_ATTACK: return 150
            case HEAL: return 250
        }
    })
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
        if (energy >= 600) return { work: 5, carry: 1, move: 1 } // RCL 3
        if (energy >= 550) return { work: 5, move: 1 } // RCL 2
        if (energy >= 200) return { work: 1, carry: 1, move: 1 } // RCL 1
        return undefined
    },
    repairer: energy => {
        if (energy >= 850) return { work: 5, carry: 3, move: 4 } // RCL 4
        if (energy >= 650) return { work: 4, carry: 2, move: 3 } // RCL 3
        if (energy >= 400) return { work: 2, carry: 2, move: 2 } // RCL 2
        if (energy >= 200) return { work: 1, carry: 1, move: 1 } // RCL 1
        return undefined
    },
    upgrader: energy => {
        if (energy >= 850) return { work: 5, carry: 3, move: 4 } // RCL 4
        if (energy >= 650) return { work: 4, carry: 2, move: 3 } // RCL 3
        if (energy >= 200) return { work: 1, carry: 1, move: 1 } // RCL 1
        return undefined
    },
    builder: energy => {
        if (energy >= 3000) return { work: 15, carry: 15, move: 15 } // RCL 7
        if (energy >= 1700) return { work: 10, carry: 6, move: 8 } // RCL 5
        if (energy >= 850) return { work: 5, carry: 3, move: 4 } // RCL 4
        if (energy >= 650) return { work: 4, carry: 2, move: 3 } // RCL 3
        return undefined
    },
    carrier: energy => {
        if (energy >= 750) return { carry: 10, move: 5 } // RCL 3
        if (energy >= 450) return { carry: 6, move: 3 } // RCL 2
        if (energy >= 150) return { carry: 2, move: 1 } // RCL 1
        return undefined
    },
    viewer: energy => {
        if (energy >= 50) return { move: 1 }
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
        if (energy >= 4280) return { tough: 3, ranged_attack: 10, heal: 9, move: 10 } // RCL 7
        return undefined
    }
}

export function parseGeneralBodyConf (g: GeneralBodyConfig, e: number): BodyConfig | undefined {
    return typeof g === 'string' ? getBodyConfigByAuto[g](e) : g
}

declare global {
    type AutoBodyConstant =
        "harvester" |
        "repairer" |
        "upgrader" |
        "builder" |
        "carrier" |
        "viewer" |
        "reserver" |
        "remoteHarvester" |
        "keeperHarvester" |
        "remoteCarrier" |
        "keeperAttacker" |
        "keeperSingleAttacker"
    interface BodyConfig {
        work?: number
        carry?: number
        move?: number
        claim?: number
        attack?: number
        heal?: number
        tough?: number
        ranged_attack?: number
    }
    type GeneralBodyConfig = AutoBodyConstant | BodyConfig
}
