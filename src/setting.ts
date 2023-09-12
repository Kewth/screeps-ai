import { initCarrierMemory } from "role/carrier";
import { initFarBuilderMemory } from "role/farBuilder";
import { initFarCarrierMemory } from "role/farCarrier";
import { initFarHarvesterMemory } from "role/farHarvester";
import { initFarReserverMemory } from "role/farReserver";
import { initHarvesterMemory } from "role/harvester";
import { initRepairerMemory } from "role/repairer";
import { initUpgraderMemory } from "role/upgrader";
import { makeBody, makeTask } from "utils/other";

// 优先级从前往后
export const maintainCreepList: spawnTask[] = [

    // 自定义房间
    makeTask('sim', 'H', makeBody({work: 1, move: 1}), {
        role: 'harvester', taskName: 'auto', sourceFlagName: 'source'
    }, 1),

    // Shard3 世界

    // carrier
    makeTask('E26S27', 'C', makeBody({carry: 4, move: 2}), initCarrierMemory(), 1),
    // harvester
    makeTask('E26S27', 'H', makeBody({work: 5, move: 1}), initHarvesterMemory('source1'), 1),
    // repairer
    makeTask('E26S27', 'R', makeBody({work: 2, carry: 2, move: 2}), initRepairerMemory(), 1),
    // upgrader
    makeTask('E26S27', 'U', makeBody({work: 4, carry: 2, move: 3}), initUpgraderMemory(), 1),
    // 外矿开采
    // harvester
    makeTask('E26S27', 'fH', makeBody({work: 5, move: 3}), initFarHarvesterMemory('source2'), 1),
    // carrier
    // move:carry = 1:1 保证移动速度
    // 一个来回约 100-120 tick
    makeTask('E26S27', 'fC', makeBody({carry: 5, move: 5}), initFarCarrierMemory('source2'), 2),
    // reserver
    makeTask('E26S27', 'RE', makeBody({claim: 2, move: 2}), initFarReserverMemory('reserve1'), 1),
    // builder
    // 该配置只合适用来建 container
    makeTask('E26S27', 'fB', makeBody({work: 2, carry: 1, move: 1}), initFarBuilderMemory('secondRoom'), 1),
]
