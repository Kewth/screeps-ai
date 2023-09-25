import { initBuilderMemory } from "role/builder";
import { initCarrierMemory } from "role/carrier";
import { initExtraUpgraderMemory } from "role/extraUpgrader";
import { initFarBuilderMemory } from "role/farBuilder";
import { initFarCarrierMemory } from "role/farCarrier";
import { initFarHarvesterMemory } from "role/farHarvester";
import { initFarReserverMemory } from "role/farReserver";
import { initHarvesterMemory } from "role/harvester";
import { initRepairerMemory } from "role/repairer";
import { initSourceKillerMemory } from "role/sourceKiller";
import { initUpgraderMemory } from "role/upgrader";
import { makeBody, makeTask } from "utils/other";

// 优先级从前往后
export const maintainCreepList: SpawnTask[] = [

    // 自定义房间
    makeTask('sim', 'H', makeBody({move: 1}), initHarvesterMemory('source'), 1),

    // Shard3 世界
    // carrier
    // <= 300 cost 适用于紧急情况
    makeTask('E26S27', 'C', makeBody({carry: 4, move: 2}), initCarrierMemory(), 1),
    makeTask('E26S27', 'C^', makeBody({carry: 12, move: 6}), initCarrierMemory(), 2),
    // harvester
    makeTask('E26S27', 'H', makeBody({work: 5, carry: 1, move: 1}), initHarvesterMemory('source1'), 1),
    // repairer
    makeTask('E26S27', 'R', makeBody({work: 4, carry: 4, move: 8}), initRepairerMemory(), 1),
    // builder
    makeTask('E26S27', 'B', makeBody({work: 8, carry: 8, move: 8}), initBuilderMemory(), 1),
    // upgrader
    makeTask('E26S27', 'U', makeBody({work: 7, carry: 3, move: 5}), initUpgraderMemory(), 1),
    // extra upgrader
    makeTask('E26S27', 'Uex', makeBody({work: 15, carry: 5, move: 10}), initExtraUpgraderMemory(), 2),

    //
    // source killer
    makeTask('E26S27', 'K', makeBody({tough: 3, heal: 4, ranged_attack: 5, move: 6}), initSourceKillerMemory('Guard3', 'Guard4'), 3),
    // harvester
    makeTask('E26S27', 'sH', makeBody({work: 9, carry: 1, move: 5}), initFarHarvesterMemory('Source3'), 1),
    // carrier
    // 有 link 的话来回 20-30 ticks 但是还要考虑 link 堵塞以及捡 dropped resource
    makeTask('E26S27', 'sC', makeBody({carry: 13, work: 1, move: 7}), initFarCarrierMemory('Source3'), 1),

    // source killer
    // makeTask('E26S27', 'K^', makeBody({tough: 3, heal: 4, ranged_attack: 5, move: 6}), initSourceKillerMemory('Guard4', 'Guard3'), 2),
    // harvester
    makeTask('E26S27', 'sH^', makeBody({work: 9, carry: 1, move: 5}), initFarHarvesterMemory('Source4', 'Container4'), 1),
    // carrier
    makeTask('E26S27', 'sC^', makeBody({carry: 17, work: 1, move: 9}), initFarCarrierMemory('Source4'), 2),

    // source killer
    makeTask('E26S27', 'K^^', makeBody({tough: 3, heal: 4, ranged_attack: 5, move: 6}), initSourceKillerMemory('Guard5'), 2),
    // harvester
    makeTask('E26S27', 'sH^^', makeBody({work: 9, carry: 1, move: 5}), initFarHarvesterMemory('Source5', 'Container5'), 1),
    // carrier
    makeTask('E26S27', 'sC^^', makeBody({carry: 13, work: 1, move: 7}), initFarCarrierMemory('Source5'), 1),

    // 外矿开采
    // harvester
    makeTask('E26S27', 'fH', makeBody({work: 5, carry: 1, move: 3}), initFarHarvesterMemory('source2'), 1),
    // carrier
    // move:carry = 1:1 保证移动速度
    // 一个来回约 100-120 tick
    makeTask('E26S27', 'fC', makeBody({carry: 15, work: 1, move: 8}), initFarCarrierMemory('source2'), 1),
    // reserver
    makeTask('E26S27', 'fRE', makeBody({claim: 2, move: 2}), initFarReserverMemory('reserve1'), 1),
    // builder
    // makeTask('E26S27', 'fB', makeBody({work: 2, carry: 2, move: 2}), initFarBuilderMemory('secondRoom'), 1),
]
