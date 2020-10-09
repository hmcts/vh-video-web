import { ModalService } from 'src/app/services/modal.service';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, heartbeatSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { ParticipantNetworkHealthComponent } from '../participant-network-health.component';
import { Guid } from 'guid-typescript';
import { ParticipantStatus } from 'src/app/services/clients/api-client';

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

    const isNetworkPoorTestCases = [
        { status: HeartbeatHealth.None, expected: false },
        { status: HeartbeatHealth.Good, expected: false },
        { status: HeartbeatHealth.Poor, expected: true },
        { status: HeartbeatHealth.Bad, expected: false }
    ];

    isNetworkPoorTestCases.forEach(testcase => {
        it(`should return isNetworkPoor ${testcase.expected} when heartbeat is ${testcase.status}`, () => {
            const payload = new ParticipantHeartbeat(globalConference.id, globalParticipant.id, testcase.status, 'Chrome', '82.0.0');
            heartbeatSubject.next(payload);
            expect(component.isNetworkPoor).toBe(testcase.expected);
        });
    });

    it('should ignore heartbeat not for participant', () => {
        component.networkHealth = undefined;
        const payload = new ParticipantHeartbeat(globalConference.id, Guid.create().toString(), HeartbeatHealth.Good, 'Chrome', '82.0.0');
        heartbeatSubject.next(payload);
        expect(component.isNetworkPoor).toBeUndefined();
    });

    it('should open guidance modal', () => {
        component.displayGuidanceModal();
        expect(modalService.open).toHaveBeenCalledWith(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    });

    it('should close guidance modal', () => {
        component.closeGuidanceModal();
        expect(modalService.close).toHaveBeenCalledWith(ParticipantNetworkHealthComponent.GUIDANCE_MODAL);
    });

    it('should return isVideoOn true when participant is in consultation', () => {
        component.participant.status = ParticipantStatus.InConsultation;
        expect(component.isVideoOn).toBeTruthy();
    });

    it('should return isVideoOn true when participant is in hearing', () => {
        component.participant.status = ParticipantStatus.InHearing;
        expect(component.isVideoOn).toBeTruthy();
    });

    it('should return isVideoOn false when participant is waiting room', () => {
        component.participant.status = ParticipantStatus.Available;
        expect(component.isVideoOn).toBeFalsy();
    });

    it('should return isDisconnected false when participant is in hearing', () => {
        component.participant.status = ParticipantStatus.InHearing;
        expect(component.isDisconnected).toBeFalsy();
    });

    it('should return isDisconnected false when participant is waiting room', () => {
        component.participant.status = ParticipantStatus.Available;
        expect(component.isDisconnected).toBeFalsy();
    });

    it('should return isDisconnected true when participant is disconnected', () => {
        component.participant.status = ParticipantStatus.Disconnected;
        expect(component.isDisconnected).toBeTruthy();
    });
});
