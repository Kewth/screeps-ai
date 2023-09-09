import { Builder } from "role/Builder";
import { Carrier } from "role/Carrier";
import { Cleaner } from "role/Cleaner";
import { Harvester } from "role/Harvester";
import { Repairer } from "role/Repairer";
import { Stealer } from "role/Stealer";
import { Upgrader } from "role/Upgrader";
import { RoomStat } from "room/stat";
import { ErrorMapper } from "utils/ErrorMapper";

global.mainRoomName = 'E26S27';

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    // 分析每个房间
    RoomStat.stat(room);
    // 孵化优先级从后往前
    Stealer.work_all_creeps(room);
    Cleaner.work_all_creeps(room);
    Upgrader.work_all_creeps(room);
    Builder.work_all_creeps(room);
    Repairer.work_all_creeps(room);
    Carrier.work_all_creeps(room);
    Harvester.work_all_creeps(room);
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
