import { ParticipantAlertComponent } from './participant-alert.component';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, heartbeatSubjectMock } from 'src/app/testing/mocks/mock-events-service';

describe('ParticipantAlertComponent', () => {
    let component: ParticipantAlertComponent;
    const globalConference = new ConferenceTestData().getConferenceDetailNow();
    const globalParticipant = globalConference.participants[0];
    const eventsService = eventsServiceSpy;
    const heartbeatSubject = heartbeatSubjectMock;

    beforeEach(() => {
        component = new ParticipantAlertComponent(eventsService);
        component.participant = globalParticipant;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should subscribe to participant heartbeat', () => {
        const score = HeartbeatHealth.Good;
        const payload = new ParticipantHeartbeat(globalConference.id, globalParticipant.id, score, 'Chrome', '82.0.0');
        heartbeatSubject.next(payload);
        expect(component.isNetworkGood).toBeTruthy();
        expect(component.networkHealth).toBe(score);
    });
});
