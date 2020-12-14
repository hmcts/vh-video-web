export interface IVideoCallPreferences {
    audioOnly: boolean;
}
export class VideoCallPreferences implements IVideoCallPreferences {
    public audioOnly: boolean;

    constructor(data?: IVideoCallPreferences) {
        if (data) {
            for (const property in data) {
                if (data.hasOwnProperty(property)) {
                    (<any>this)[property] = (<any>data)[property];
                }
            }
        }
    }
}
