import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomType
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ModalService } from 'src/app/services/modal.service';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { IndividualParticipantStatusListComponent } from './individual-participant-status-list.component';

describe('IndividualParticipantStatusListComponent', () => {
    let component: IndividualParticipantStatusListComponent;
    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let modalService: jasmine.SpyObj<ModalService>;
    let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;
    let conference: ConferenceResponse;

    let timer: jasmine.SpyObj<NodeJS.Timer>;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
            'raiseConsultationRequest',
            'respondToConsultationRequest',
            'leaveConsultation',
            'respondToAdminConsultationRequest'
        ]);
        consultationService.raiseConsultationRequest.and.callFake(() => Promise.resolve());
        consultationService.respondToConsultationRequest.and.callFake(() => Promise.resolve());
        consultationService.leaveConsultation.and.callFake(() => Promise.resolve());
        consultationService.respondToAdminConsultationRequest.and.callFake(() => Promise.resolve());

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['open', 'close']);

        notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'initConsultationRequestRingtone',
            'playConsultationRequestRingtone',
            'stopConsultationRequestRingtone'
        ]);
    });

    beforeEach(() => {
        notificationSoundsService.initConsultationRequestRingtone.calls.reset();
        notificationSoundsService.stopConsultationRequestRingtone.calls.reset();

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new IndividualParticipantStatusListComponent(
            adalService,
            consultationService,
            eventsService,
            modalService,
            logger,
            videoWebService,
            notificationSoundsService
        );
        conference = new ConferenceTestData().getConferenceDetailFuture();
        component.consultationRequester = new Participant(conference.participants[0]);
        component.consultationRequestee = new Participant(conference.participants[1]);
        component.conference = conference;
    });

    it('should init properties and setup ringtone on init', () => {
        component.ngOnInit();
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJugdeParticipants).toBeDefined();
        expect(notificationSoundsService.initConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should clear timeout when ringing stops', () => {
        spyOn(global, 'clearTimeout').and.callThrough();
        component.outgoingCallTimeout = timer;
        component.stopCallRinging();
        expect(global.clearTimeout).toHaveBeenCalledWith(timer);
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalled();
    });

    it('should not cancel outgoing call is user is not waiting for a response', async () => {
        component.waitingForConsultationResponse = false;
        await component.cancelOutgoingCall();
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(0);
    });

    it('should hide request modal and stop ringing when outgoing private consulation has been cancelled', async () => {
        component.waitingForConsultationResponse = true;
        await component.cancelOutgoingCall();

        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Cancelled
        );
        expect(notificationSoundsService.stopConsultationRequestRingtone).toHaveBeenCalledTimes(1);
        expect(modalService.open).toHaveBeenCalledWith(component.REJECTED_PC_MODAL)
    });

    it('should return true when participant is available', () => {
        const availableParticipant = component.conference.participants.find(x => x.status === ParticipantStatus.Available);
        expect(component.isParticipantAvailable(availableParticipant)).toBeTruthy();
    });

    it('should return false when participant is not available', () => {
        const availableParticipant = component.conference.participants.find(x => x.status !== ParticipantStatus.Available);
        expect(component.isParticipantAvailable(availableParticipant)).toBeFalsy();
    });

    it('should return unavailable text for all non-available statuses', () => {
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Disconnected }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InConsultation }))).toBe(
            'Unavailable'
        );
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InHearing }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Joining }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.NotSignedIn }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.UnableToJoin }))).toBe('Unavailable');
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.None }))).toBe('Unavailable');
    });

    it('should return available text for when participant is available', () => {
        expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Available }))).toBe('Available');
    });

    it('should not be able to call participant is user is judge', () => {
        const judge = component.conference.participants.find(x => x.role === Role.Judge);
        adalService.userInfo.userName = judge.username;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is delayed', () => {
        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should not be able to begin call self', () => {
        consultationService.raiseConsultationRequest.and.callFake(() => Promise.resolve());
        adalService.userInfo.userName = 'chris.green@hearings.net';
        const participant = conference.participants.find(x => x.username === adalService.userInfo.userName);
        component.begingCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalledTimes(0);
    });

    it('should be able to begin call with another participant', () => {
        spyOn(component, 'startCallRinging').and.callFake(() => Promise.resolve());

        const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
        participant.status = ParticipantStatus.Available;
        component.begingCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalled();
    });

    it('should answer consultation request', async () => {
        component.waitingForConsultationResponse = true;

        spyOn(component, 'stopCallRinging');

        await component.answerConsultationRequest('Accepted');

        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted
        );
    });

    it('should respond to admin consultation with answer "Accepted"', async () => {
        component.consultationRequestee = new Participant(conference.participants[1]);
        const adminConsultationMessage = new AdminConsultationMessage(
            conference.id,
            RoomType.AdminRoom,
            component.consultationRequestee.username,
            null
        );
        component.waitingForConsultationResponse = true;
        component.adminConsultationMessage = adminConsultationMessage;

        spyOn(component, 'stopCallRinging');

        await component.acceptVhoConsultationRequest();
        expect(component.waitingForConsultationResponse).toBeFalsy();
        expect(consultationService.respondToAdminConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted,
            adminConsultationMessage.roomType
        );
    });
});
