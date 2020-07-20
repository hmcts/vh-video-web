import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingRoomMonitorComponent } from '../waiting-room-monitor.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, heartbeatSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { ParticipantHeartbeat, HeartbeatHealth } from 'src/app/services/models/participant-heartbeat';

describe('WaitingRoomMonitorComponent', () => {
    let component: WaitingRoomMonitorComponent;
    const globalConference = new ConferenceTestData().getConferenceDetailNow();
    const globalParticipant = globalConference.participants[0];
    const eventsService = eventsServiceSpy;
    const heartbeatSubject = heartbeatSubjectMock;

    beforeEach(() => {
        component = new WaitingRoomMonitorComponent(eventsService);
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
