import { ConferenceSetting } from '../models/conference-setting';

export class ConferenceSettingHelper {
    static isExpired(conferenceSetting: ConferenceSetting): boolean {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const createdDate = new Date(conferenceSetting.createdDate);

        return createdDate <= yesterday;
    }
}
