export class PackageLost {
    constructor(
        recentPackageLost: number,
        browserName: string,
        browserVersion: string,
        osName: string,
        osVersion: string,
        timestamp: number
    ) {
        this.browserName = browserName;
        this.browserVersion = browserVersion;
        this.osName = osName;
        this.osVersion = osVersion;
        this.recentPackageLost = recentPackageLost;
        this.timestamp = timestamp;
    }

    recentPackageLost: number;
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
    timestamp: number;
}
