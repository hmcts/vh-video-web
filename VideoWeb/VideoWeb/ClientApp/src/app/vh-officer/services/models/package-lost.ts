export class PackageLost {
    constructor(recentPackageLost: number, browserName: string, browserVersion: string, timestamp: number) {
        this.browserName = browserName;
        this.browserVersion = browserVersion;
        this.recentPackageLost = recentPackageLost;
        this.timestamp = timestamp;
    }
    recentPackageLost: number;
    browserName: string;
    browserVersion: string;
    timestamp: number;
}
