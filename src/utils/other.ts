export function newCreepName(name: string): string {
    let i = 0
    while (`${name}${i}` in Game.creeps || `${name}${i}` in Memory.creeps) i++
    return `${name}${i}`
}

export function calcTaskName(task: SpawnTask): string {
    return `${task.roomName}-${task.creepName}`
}

export function logError(err: any, name: any): void {
    console.log(`ERROR@${Game.time}: ${err} (by ${name})`)
}
export function logConsole(info: any): void {
    console.log(info)
}

export function noInvader (roomFlag: string): boolean {
    const roomName = Game.flags[roomFlag].pos.roomName
    const mem = Memory.rooms[roomName]
    if (!mem) return true
    return !mem.invaderTime || Game.time > mem.invaderTime + 1500
}

export function isInvader (creep: Creep): boolean {
    return !creep.my && creep.owner.username != 'Source Keeper'
}

// export function makeBody
//     (work: number = 0, carry: number = 0, move: number = 0,
//         claim: number = 0, attack: number = 0, heal: number = 0)
// {
//     let res: BodyPartConstant[] = []
//     for (let i = 0; i < work; i ++) res.push(WORK)
//     for (let i = 0; i < carry; i ++) res.push(CARRY)
//     for (let i = 0; i < move; i ++) res.push(MOVE)
//     for (let i = 0; i < claim; i ++) res.push(CLAIM)
//     for (let i = 0; i < attack; i ++) res.push(ATTACK)
//     for (let i = 0; i < heal; i ++) res.push(HEAL)
//     return res
// }

export interface BodyConfig {
    work?: number
    carry?: number
    move?: number
    claim?: number
    attack?: number
    heal?: number
    tough?: number
    ranged_attack?: number
}
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

// export function calcCost(b: BodyConfig): number {
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
            case WORK: return 50
            case MOVE: return 50
            case CLAIM: return 600
            case ATTACK: return 80
            case RANGED_ATTACK: return 150
            case HEAL: return 250
        }
    })
}

export function makeTask
    (roomName: string, creepName: string, body: BodyPartConstant[],
        memory: CreepMemory, num: number): SpawnTask
{
    return {
        roomName: roomName,
        creepName: creepName,
        body: body,
        memory: memory,
        num: num,
    }
}

// export function makeTask<RoleMemory extends CreepMemory>
//     (roomName: string, creepName: string, body: BodyConfig, num: number,
//         role: RoleString, memory: RoleMemory): SpawnTask
// {
//     let mem: CreepMemory = memory
//     mem.role = role
//     mem.taskName = 'auto'
//     return {
//         roomName: roomName,
//         creepName: creepName,
//         body: body.get(),
//         num: 1,
//         memory: mem,
//     }
// }
