import { ModalService } from 'src/app/services/modal.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, heartbeatSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { ParticipantNetworkHealthComponent } from '../participant-network-health.component';

describe('ParticipantNetworkHealthComponent', () => {
    let component: ParticipantNetworkHealthComponent;
    const globalConference = new ConferenceTestData().getConferenceDetailNow();
    const globalParticipant = globalConference.participants[0];
    const eventsService = eventsServiceSpy;
    const heartbeatSubject = heartbeatSubjectMock;
    let modalService: jasmine.SpyObj<ModalService>;

    beforeAll(() => {
        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['add', 'remove', 'open', 'close', 'closeAll']);
    });

    beforeEach(() => {
        component = new ParticipantNetworkHealthComponent(eventsService, modalService);
        component.participant = globalParticipant;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should return false when heartbeat is not set', () => {
        component.networkHealth = undefined;
        expect(component.isNetworkGood).toBeFalsy();
    });

    const isNetworkGoodTestCases = [
        { status: HeartbeatHealth.None, expected: false },
        { status: HeartbeatHealth.Good, expected: true },
        { status: HeartbeatHealth.Poor, expected: false },
        { status: HeartbeatHealth.Bad, expected: false }
    ];

    isNetworkGoodTestCases.forEach(testcase => {
        it(`should return ${testcase.expected} when heartbeat is ${testcase.status}`, () => {
            const payload = new ParticipantHeartbeat(globalConference.id, globalParticipant.id, testcase.status, 'Chrome', '82.0.0');
            heartbeatSubject.next(payload);
            expect(component.isNetworkGood).toBe(testcase.expected);
        });
    });

    it('should open guidance modal', () => {});

    it('should close guidance modal', () => {});
});
