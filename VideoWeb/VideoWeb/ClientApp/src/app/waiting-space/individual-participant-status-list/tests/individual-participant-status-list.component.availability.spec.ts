import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ModalService } from 'src/app/services/modal.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';

describe('IndividualParticipantStatusListComponent Participant Status and Availability', () => {
    let component: IndividualParticipantStatusListComponent;
    let adalService: jasmine.SpyObj<AdalService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let modalService: jasmine.SpyObj<ModalService>;
    let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;
    let conference: ConferenceResponse;

    let timer: jasmine.SpyObj<NodeJS.Timer>;

    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        const testParticipant = conference.participants.filter(x => x.role === Role.Individual)[0];
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: testParticipant.username, authenticated: true }
        });

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

        modalService = jasmine.createSpyObj<ModalService>('ModalService', ['open', 'closeAll']);

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
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'Available' },
        { status: ParticipantStatus.InConsultation, expected: 'Unavailable' },
        { status: ParticipantStatus.InHearing, expected: 'Unavailable' },
        { status: ParticipantStatus.Disconnected, expected: 'Unavailable' },
        { status: ParticipantStatus.Joining, expected: 'Unavailable' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Unavailable' },
        { status: ParticipantStatus.UnableToJoin, expected: 'Unavailable' },
        { status: ParticipantStatus.None, expected: 'Unavailable' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return text "${test.expected}" when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatusText(pat)).toBe(test.expected);
        });
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

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    const handleParticipantStatus = [
        { status: ParticipantStatus.Available },
        { status: ParticipantStatus.InHearing },
        { status: ParticipantStatus.Disconnected },
        { status: ParticipantStatus.Joining },
        { status: ParticipantStatus.NotSignedIn },
        { status: ParticipantStatus.UnableToJoin },
        { status: ParticipantStatus.None }
    ];

    handleParticipantStatus.forEach(test => {
        it(`should take no action user receives participant status message with status ${test.status}`, () => {
            const participant = component.conference.participants.filter(x => x.role === Role.Individual)[0];
            const payload = new ParticipantStatusMessage(participant.id, participant.username, conference.id, test.status);

            participantStatusSubject.next(payload);
            expect(modalService.closeAll).toHaveBeenCalledTimes(0);
        });
    });

    it('should close all modals user receives in consultation message', () => {
        const participant = component.conference.participants.filter(x => x.username === adalService.userInfo.userName)[0];

        const payload = new ParticipantStatusMessage(participant.id, participant.username, conference.id, ParticipantStatus.InConsultation);

        participantStatusSubject.next(payload);
        expect(modalService.closeAll).toHaveBeenCalled();
    });
});
