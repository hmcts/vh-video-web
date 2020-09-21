export class SupportedBrowserModel {
    iconPath: string;
    name: string;
    displayName: string;
    constructor(name: string, displayName: string) {
        this.name = name;
        this.iconPath = `/assets/images/${name.toLowerCase()}_browser_icon.png`;
        this.displayName = displayName;
    }
}
