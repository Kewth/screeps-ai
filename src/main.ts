import { checkCache } from "cache";
import { marketWork } from "market";
import { checkMemory } from "memory";
import { statsMemory } from "memory/stats";
import { mountAll } from "mount";
import { reSpawn } from "mount/room/spawn";
import { ErrorMapper } from "utils/ErrorMapper";

// 挂载只需执行一次
mountAll()

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  checkCache()
  checkMemory()

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      reSpawn(Memory.creeps[name])
      delete Memory.creeps[name]
    }
  }

  Object.values(Game.rooms).forEach( room => {
    room.work()
  })
  Object.values(Game.flags).forEach( flag => {
    flag.work()
  })
  Object.values(Game.creeps).forEach( creep => {
    creep.work()
  })
  Object.values(Game.powerCreeps).forEach( powerCreep => {
    powerCreep.work()
  })


  marketWork()


  // memory stats
  statsMemory()

  // 获取 pixel
  if (Game.cpu.bucket >= 10000) {
    Game.cpu.generatePixel()
  }
})
