import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceForUserResponse, ConferenceResponse } from 'src/app/services/clients/api-client';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from './data/conference-test-data';

export class MockVideoWebService extends VideoWebService {

    getConferencesForUser(): Observable<ConferenceForUserResponse[]> {
        return of(new ConferenceTestData().getTestData());
    }

    getConferenceById(conferenceId: string): Observable<ConferenceResponse> {
        return of(new ConferenceTestData().getConferenceDetail());
    }
}
