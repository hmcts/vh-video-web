export class PackageLost {
    constructor(
        public recentPackageLost: number,
        public browserName: string,
        public browserVersion: string,
        public osName: string,
        public osVersion: string,
        public timestamp: number
    ) {}
}
