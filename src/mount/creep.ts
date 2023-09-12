import { getRoleLogic } from "role"
import { logError } from "utils/other"

export function mountCreep() {
    Creep.prototype.work = function() {
        if (this.spawning) return
        const logic = getRoleLogic[this.memory.role]
        // prepare 阶段
        if (!this.memory.ready) {
            if (!logic.prepare_stage || logic.prepare_stage(this)) {
                this.memory.ready = true
            }
            else return
        }
        // source/target 阶段
        const changeStage = this.memory.working
            ? !logic.target_stage || logic.target_stage(this)
            : !logic.source_stage || logic.source_stage(this)
        if (changeStage) {
            this.memory.working = !this.memory.working
            const changeStageAgain = this.memory.working
                ? !logic.target_stage || logic.target_stage(this)
                : !logic.source_stage || logic.source_stage(this)
            if (changeStageAgain)
                logError('change stage twice a tick', this.name)
        }
    }
}

declare global {
    interface Creep {
        work(): void
    }
}
