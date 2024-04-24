export class UnsupportedBrowserHeartbeat {
    constructor(
        public name: string,
        public version: string
    ) {
        this.name = name;
        this.version = version;
    }
}
