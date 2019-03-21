import { ConferenceForUserResponse } from 'src/app/services/clients/api-client';

export class ConferenceTestData {

    getConferenceNow(): ConferenceForUserResponse {
        const currentDateTime = new Date(new Date().getTime());
        const conference = new ConferenceForUserResponse({
            id: '363725D0-E3D6-4D4A-8D0A-E8E57575FBC4',
            case_name: 'C V I',
            case_number: '123ABC',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: currentDateTime
        });

        return conference;
    }

    getConferencePast(): ConferenceForUserResponse {
        const pastDate = new Date(new Date().getTime());
        pastDate.setUTCHours(pastDate.getUTCHours() - 26);
        const conference = new ConferenceForUserResponse({
            id: '58CB20C7-377D-4581-8069-3776F583684B',
            case_name: 'BW V BP',
            case_number: 'ABC1234',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: pastDate
        });
        return conference;
    }

    getConferenceFuture(): ConferenceForUserResponse {
        const futureDate = new Date(new Date().getTime());
        futureDate.setUTCHours(futureDate.getUTCHours() + 26);
        const conference = new ConferenceForUserResponse({
            id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            case_name: 'WM V T',
            case_number: '0987UDIHH',
            case_type: 'Financial Tax Remedy',
            scheduled_date_time: futureDate
        });
        return conference;
    }

    getTestData(): Array<ConferenceForUserResponse> {
        const testData: Array<ConferenceForUserResponse> = [];
        const conference1 = this.getConferenceNow();
        const conference2 = this.getConferencePast();
        const conference3 = this.getConferenceFuture();
        testData.push(conference1);
        testData.push(conference2);
        testData.push(conference3);
        return testData;
    }
}
