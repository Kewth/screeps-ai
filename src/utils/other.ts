export function newCreepName(configName: string): string {
    let i = 0
    while (`${configName}_${i}` in Game.creeps || `${configName}_${i}` in Memory.creeps) i++
    return `${configName}_${i}`
}

export function calcConfigName(roomName: string, name: string): string {
    return `${roomName}_${name}`
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

// all:     enemy | invader | source keeper | friend | my
// hostile: enemy | invader | source keeper | friend
// evil:    enemy | invader | source keeper
export function isMy (obj: {owner: Owner}): boolean {
    return obj.owner.username == 'Kewth'
}
export function isFriend (obj: {owner: Owner}): boolean {
    return obj.owner.username in [
        'SodiumH',
    ]
}
export function isSourceKeeper (obj: {owner: Owner}): boolean {
    return obj.owner.username == 'Source Keeper'
}
export function isInvader (obj: {owner: Owner}): boolean {
    return obj.owner.username == 'Invader'
}
export function isEnemy (obj: {owner: Owner}): boolean {
    return !isMy(obj) && !isFriend(obj) && !isSourceKeeper(obj) && !isInvader(obj)
}
export function isEnemyOrInvader (obj: {owner: Owner}): boolean {
    return !isMy(obj) && !isFriend(obj) && !isSourceKeeper(obj)
}
export function isEvil (obj: {owner: Owner}): boolean {
    return !isMy(obj) && !isFriend(obj)
}

export function anyStore (obj: TypeWithStore): ResourceConstant | undefined {
    return _.findKey(obj.store, (v: number) => v > 0) as ResourceConstant | undefined
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

export function hasResource(obj: Resource | TypeWithStore): boolean {
    if (obj instanceof Resource) return obj.amount > 0
    // 通用型存储
    return anyStore(obj) !== undefined
}
