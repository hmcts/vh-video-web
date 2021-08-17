import { BackgroundFilter } from 'src/app/services/models/background-filter';

export interface IVideoCallPreferences {
    audioOnly: boolean;
    background: BackgroundFilter | null;
}
export class VideoCallPreferences implements IVideoCallPreferences {
    public audioOnly: boolean;
    public background: BackgroundFilter | null;

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
