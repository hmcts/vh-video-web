export class SupportedBrowserModel {
  iconPath: string;
  name: string;
  constructor(name: string) {
    this.name = name;
    this.iconPath = `/assets/images/${name.toLowerCase()}_browser_icon.png`;
  }
}
