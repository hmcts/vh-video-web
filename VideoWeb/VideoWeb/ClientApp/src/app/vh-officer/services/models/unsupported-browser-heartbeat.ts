export class UnsupportedBrowserHeartbeat {
    constructor(name: string, version: string) {
        this.name = name;
        this.version = version;
    }

    name: string;
    version: string;
}
