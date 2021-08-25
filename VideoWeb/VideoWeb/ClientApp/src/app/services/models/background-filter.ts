export enum BackgroundFilter {
    blur = 'blur',
    HMCTS = 'HMCTS',
    SCTS = 'SCTS'
}

export interface IVideoFilterer {
    retrieveVideoElement(): HTMLVideoElement;
}
