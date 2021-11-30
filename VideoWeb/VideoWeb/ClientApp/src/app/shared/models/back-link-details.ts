export class BackLinkDetails {
    text: string;
    path: string;
    className: string;

    constructor(text: string = 'back-navigation.back', path: string = null, className: string = null) {
        this.text = text;
        this.path = path;
        this.className = className;
    }
}
