import { ConferenceSetting } from '../models/conference-setting';

export class ConferenceSettingHelper {
    static isExpired(conferenceSetting: ConferenceSetting): boolean {
        const today = new Date();
        const cutoff = new Date(today);
        cutoff.setDate(today.getDate() - 1);
        cutoff.setHours(0, 0, 0, 0);
        const createdDate = new Date(conferenceSetting.createdDate);

        return createdDate <= cutoff;
    }
}
