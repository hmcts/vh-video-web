export class BackLinkDetails {
    text: string;
    path: string;

    constructor(text: string = 'back-navigation.back', path: string = null) {
        this.text = text;
        this.path = path;
    }
}
