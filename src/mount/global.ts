import { creepApi } from "creepApi"
import { logConsole, logError, myMax, myMin } from "utils/other"
import { reSpawn } from "./room/spawn"

// 控制台操作对象
const T = {
    rmConf(configName: string) {
        return creepApi.remove(configName)
    },
    markClaim(roomName: string) {
        if (!Memory.rooms[roomName])
            Memory.rooms[roomName] = {} as RoomMemory // 强行赋值，在下一个 tick 格式化
        Memory.rooms[roomName].needClaim = true
        return OK
    },
    reSP(creepName: string) {
        if (Memory.creeps[creepName]) {
            reSpawn(Memory.creeps[creepName])
            return OK
        }
        else {
            return ERR_NOT_FOUND
        }
    },
    // 更新 live Count (用于自己操作失误后的补救...)
    updateLiveCount(check: number) {
        const DOIT: boolean = -50 <= check - Game.time && check - Game.time <= 50
        let temp: any = {}
        for (const name in Memory.creeps) {
            if (!Memory.creeps[name].reSpawnAlready) {
                const conf = Memory.creeps[name].configName
                temp[conf] = temp[conf] ? temp[conf] + 1 : 1
            }
        }
        [..._.keys(temp), ..._.keys(Memory.creepConfigs)].forEach(conf => {
            const tmplive = temp[conf] ? temp[conf] : 0
            const memlive = Memory.creepConfigs[conf]?.live
            if (tmplive != memlive) {
                logError(`${conf}: ${tmplive} vs ${memlive}`, 'updateLiveCount')
            }
            if (DOIT) {
                if (!Memory.creepConfigs[conf]) {
                    // creepConfigs 没了，寄
                }
                else {
                    Memory.creepConfigs[conf].live = tmplive
                }
            }
        })
    },
    sell(roomName: string, resourceType: ResourceConstant, price: number, amount: number) {
        if (!roomName) {
            logConsole(`roomName, resourceType, price, amount`)
            return -1
        }
        return Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: resourceType,
            price: price / 0.95,
            totalAmount: amount,
            roomName: roomName
        })
    },
    buy(roomName: string, resourceType: ResourceConstant, price: number, amount: number) {
        if (!roomName) {
            logConsole(`roomName, resourceType, price, amount`)
            return -1
        }
        return Game.market.createOrder({
            type: ORDER_BUY,
            resourceType: resourceType,
            price: price / 1.05,
            totalAmount: amount,
            roomName: roomName
        })
    },
    pixel(extend?: number) {
        if (extend !== undefined) {
            const avgPrice = Memory.pixelActiveTotalPrice / Memory.pixelActiveAmount
            Memory.pixelActiveTotalPrice += extend * avgPrice
            Memory.pixelActiveAmount += extend
        }
        const buy = myMax(Game.market.getAllOrders({ type: ORDER_BUY, resourceType: PIXEL }), obj => obj.price)
        const sell = myMin(Game.market.getAllOrders({ type: ORDER_SELL, resourceType: PIXEL }), obj => obj.price)
        logConsole(`Active Amount: ${Memory.pixelActiveAmount}`)
        logConsole(`Average Price: ${Memory.pixelActiveTotalPrice / Memory.pixelActiveAmount}`)
        if (buy) logConsole(`Max Buying Price: ${buy.price}`)
        if (sell) logConsole(`Min Selling Price: ${sell.price}`)
    },
    mountRoom() {
        for (const roomName in Memory.rooms) {
            Object.defineProperty(global, roomName, {
                get: () => Game.rooms[roomName]
            })
        }
        return OK
    },
    capi() {
        return creepApi
    },
    visual() {
        if (global.visual)
            global.visual = undefined
        else
            global.visual = true
    },
    tmp() {
    },
}

export function mountGlobal() {
    Object.defineProperty(global, 'T', {
        get: () => T
    })
    T.mountRoom()
}
