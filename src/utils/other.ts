export function newCreepName(name: string): string {
    let i = 0
    while (`${name}${i}` in Game.creeps || `${name}${i}` in Memory.creeps) i++
    return `${name}${i}`
}

export function calcTaskName(task: spawnTask): string {
    return `${task.roomName}-${task.creepName}`
}

export function logError(err: any, name: any): void {
    console.log(`ERROR@${Game.time}: ${err} (by ${name})`)
}
export function logConsole(info: any): void {
    console.log(info)
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
}
export function makeBody(b: BodyConfig): BodyPartConstant[] {
    let res: BodyPartConstant[] = []
    if (b.work) for (let i = 0; i < b.work; i++) res.push(WORK)
    if (b.carry) for (let i = 0; i < b.carry; i++) res.push(CARRY)
    if (b.move) for (let i = 0; i < b.move; i++) res.push(MOVE)
    if (b.claim) for (let i = 0; i < b.claim; i++) res.push(CLAIM)
    if (b.attack) for (let i = 0; i < b.attack; i++) res.push(ATTACK)
    if (b.heal) for (let i = 0; i < b.heal; i++) res.push(HEAL)
    return res
}

export function makeTask
    (roomName: string, creepName: string, body: BodyPartConstant[],
        memory: CreepMemory, num: number): spawnTask
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
//         role: RoleString, memory: RoleMemory): spawnTask
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
