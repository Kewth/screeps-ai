/*
  Example types, expand on these or remove them and add your own.
  Note: Values, properties defined here do no fully *exist* by this type definiton alone.
        You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

  Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
  Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
*/

// Syntax for adding proprties to `global` (ex "global.log")
declare namespace NodeJS {
  interface Global {
    cache: Cache
    log: any
    mainRoomName: string
  }
}

// 永久 creep: 没有 hangSpawn 没有 stopSpawn 一直保持孵化
// 半永久 creep: 有 hangSpawn 没有 stopSpawn 在特殊情况被挂起并暂停孵化
// 非永久 creep: 没有 hangSpawn 有 stopSpawn 在条件达成后停止孵化
// 一次性 creep: data.onlyOnce 设置为 true ，只要死了就停止孵化
interface CreepLogic {
  prepare_stage?: (creep: Creep) => boolean
  source_stage?: (creep: Creep) => boolean
  target_stage?: (creep: Creep) => boolean
  death_stage?: (memory: CreepMemory) => void
  hangSpawn?: (spawnRoom: Room, data: CreepData) => boolean
  stopSpawn?: (spawnRoom: Room, data: CreepData) => boolean
}

type TypeWithStore = Tombstone | StructureStorage | StructureContainer | StructureLink | Creep | Ruin

// type energySourceType = Tombstone | StructureStorage | StructureContainer | StructureLink
// type energyTargetType = StructureStorage | StructureSpawn | StructureExtension | StructureTower
