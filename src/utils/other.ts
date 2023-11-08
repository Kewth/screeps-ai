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

// all:     enemy | invader | source keeper | friend | my
// hostile: enemy | invader | source keeper | friend
// evil:    enemy | invader | source keeper
export function isMy (obj: {owner: Owner}): boolean {
    return obj.owner.username == 'Kewth'
}
export function isFriend (obj: {owner: Owner}): boolean {
    return [
        'SodiumH',
    ].includes(obj.owner.username)
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
    // findLast 优先返回能量以外的高级资源
    return _.findLastKey(obj.store, (v: number) => v > 0) as ResourceConstant | undefined
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

export function strLim(str: string, num: number): string {
    while (str.length < num) str += ' '
    return str
}

export class PrintTable {
    table: (string[])[]
    constructor() {
        this.table = [[]]
    }
    add(str: string) {
        _.last(this.table).push(str)
    }
    newLine() {
        this.table.push([])
    }
    toString() {
        const colNum = myMax(this.table, lis => lis.length)?.length
        if (colNum === undefined) return undefined
        let colLims: number[] = []
        for (let i = 0; i < colNum; i ++) {
            const row = myMax(this.table, lis => lis[i]?.length)
            row && colLims.push(row[i].length + 3)
        }
        let res = ''
        this.table.forEach(lis => {
            for (let i = 0; i < lis.length; i++)
                res += strLim(lis[i], colLims[i])
            res += '\n'
        })
        return res
    }
}

export function ToN(x: number | undefined | null) {
    return x ? x : 0
}

export function myMin<T> (list: T[], func: (obj: T) => any): T | undefined {
    const res = _.min(list, func)
    return res === Infinity ? undefined : res
}
export function myMax<T> (list: T[], func: (obj: T) => any): T | undefined {
    const res = _.max(list, func)
    return res === -Infinity ? undefined : res
}

export function myFirst<T> (list: T[]): T | undefined {
    return _.first(list)
}
