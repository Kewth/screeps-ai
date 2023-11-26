export function mountFactory() {
    StructureFactory.prototype.work = function () {
        //
    }
}

declare global {
    interface StructureFactory {
        work(): void
    }
}
