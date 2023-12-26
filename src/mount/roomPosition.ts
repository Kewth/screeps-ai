export default class RoomPositionExtension extends RoomPosition {
    /**
     * 序列化
     * @returns
     */
    public serialize(): string {
        return `${this.x}/${this.y}/${this.roomName}`
    }

    /**
     * 逆序列化
     * @param s 序列化字符串
     */
    public deserializeFrom(s: string): RoomPosition {
        const lis = s.split('/')
        this.x = Number(lis[0])
        this.y = Number(lis[1])
        this.roomName = lis[2]
        return this
    }

    public static deserialize(s: string): RoomPosition {
        const lis = s.split('/')
        return new RoomPosition(Number(lis[0]), Number(lis[1]), lis[2])
    }

    public atExit(): boolean {
        return this.x == 0 || this.y == 0 || this.x == 49 || this.y == 49
    }
}

declare global {
    interface RoomPosition {
        serialize(): string
        deserializeFrom(s: string): RoomPosition
        atExit(): boolean
    }
}
