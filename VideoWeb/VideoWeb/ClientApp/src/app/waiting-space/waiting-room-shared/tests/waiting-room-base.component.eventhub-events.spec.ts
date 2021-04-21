import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    LoggedParticipantResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus
} from 'src/app/services/clients/api-client';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import {
    consultationRequestResponseMessageSubjectMock,
    requestedConsultationMessageSubjectMock,
    endpointStatusSubjectMock,
    eventHubDisconnectSubjectMock,
    eventHubReconnectSubjectMock,
    hearingStatusSubjectMock,
    hearingTransferSubjectMock,
    participantStatusSubjectMock,
    roomUpdateSubjectMock,
    roomTransferSubjectMock,
    hearingCountdownCompleteSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import {
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalEndpoint,
    globalParticipant,
    globalWitness,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    participantsLinked,
    roomClosingToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { Room } from '../../../shared/models/room';
import { RoomTransfer } from '../../../shared/models/room-transfer';
import { ElementRef } from '@angular/core';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { ConsultationInvitation } from '../../services/consultation-invitation.service';
import { Participant } from 'src/app/shared/models/participant';

describe('WaitingRoomComponent EventHub Call', () => {
    function spyPropertyGetter<T, K extends keyof T>(spyObj: jasmine.SpyObj<T>, propName: K): jasmine.Spy<() => T[K]> {
        return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
    }

    let component: WRTestComponent;

    const participantStatusSubject = participantStatusSubjectMock;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const consultationRequestResponseMessageSubject = consultationRequestResponseMessageSubjectMock;
    const requestedConsultationMessageSubject = requestedConsultationMessageSubjectMock;
    const eventHubDisconnectSubject = eventHubDisconnectSubjectMock;
    const eventHubReconnectSubject = eventHubReconnectSubjectMock;
    const hearingTransferSubject = hearingTransferSubjectMock;
    const endpointStatusSubject = endpointStatusSubjectMock;
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        logged = new LoggedParticipantResponse({
            participant_id: globalParticipant.id,
            display_name: globalParticipant.display_name,
            role: globalParticipant.role
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
        };
        component = new WRTestComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        await component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
        videoWebService.getAllowedEndpointsForConference.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscription$.unsubscribe();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }
    });

    it('should not display vho consultation request when participant is unavailable', fakeAsync(() => {
        component.participant.status = ParticipantStatus.InHearing;
        const payload = new RequestedConsultationMessage(component.conference.id, 'AdminRoom', Guid.EMPTY, component.participant.id);

        // spyOn(logger, 'debug');
        requestedConsultationMessageSubject.next(payload);
        flushMicrotasks();

        expect(notificationToastrService.showConsultationInvite).toHaveBeenCalledTimes(0);
    }));

    it('should update transferring in when inTransfer message has been received', fakeAsync(() => {
        const transferDirection = TransferDirection.In;
        const payload = new HearingTransfer(globalConference.id, globalParticipant.id, transferDirection);
        hearingTransferSubject.next(payload);
        flushMicrotasks();

        expect(component.isTransferringIn).toBeTruthy();
    }));

    it('should not update transferring in when inTransfer message has been received and participant is not current user', fakeAsync(() => {
        const transferDirection = TransferDirection.In;
        const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
        const payload = new HearingTransfer(globalConference.id, participant.id, transferDirection);

        hearingTransferSubject.next(payload);
        flushMicrotasks();

        expect(component.isTransferringIn).toBeFalsy();
    }));

    it('should not update transferring in when inTransfer message has been received and is for a different conference', fakeAsync(() => {
        const transferDirection = TransferDirection.In;
        const payload = new HearingTransfer(Guid.create().toString(), globalParticipant.id, transferDirection);

        hearingTransferSubject.next(payload);
        flushMicrotasks();

        expect(component.isTransferringIn).toBeFalsy();
    }));

    it('should ignore conference updates for another conference', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const message = new ConferenceStatusMessage(Guid.create().toString(), status);
        component.hearing.getConference().status = ConferenceStatus.InSession;
        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(ConferenceStatus.InSession);
    }));

    it('should update conference status and show video when "in session" message received and participant is not a witness', fakeAsync(() => {
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        notificationSoundsService.playHearingAlertSound.calls.reset();
        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeTruthy();
        expect(component.countdownComplete).toBeFalsy();
    }));

    it('should update conference status and get closed time when "closed" message received', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const confWithCloseTime = new ConferenceResponse(Object.assign({}, globalConference));
        confWithCloseTime.closed_date_time = new Date();
        confWithCloseTime.status = status;
        videoWebService.getConferenceById.and.resolveTo(confWithCloseTime);
        component.loggedInUser = logged;
        const message = new ConferenceStatusMessage(globalConference.id, status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(globalConference.id);
    }));

    it('should ignore participant updates for another conference', fakeAsync(() => {
        const status = ParticipantStatus.Disconnected;
        const message = new ParticipantStatusMessage(globalParticipant.id, '', Guid.create().toString(), status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status).toBeFalsy();
    }));

    it('should update participant status to available', fakeAsync(() => {
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, '', globalConference.id, status);

        participantStatusSubject.next(message);
        flushMicrotasks();

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status).toBe(message.status);
        expect(component.isAdminConsultation).toBeFalsy();
        expect(component.showVideo).toBeFalsy();
    }));

    it('should set room to null on disconnect for participant in conference', fakeAsync(() => {
        const status = ParticipantStatus.Disconnected;
        const message = new ParticipantStatusMessage(globalParticipant.id, '', globalConference.id, status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.current_room).toBeNull();
    }));

    it('should update logged in participant status to in consultation', fakeAsync(() => {
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);
        component.connected = true;

        participantStatusSubject.next(message);
        flushMicrotasks();

        expect(component.participant.status).toBe(message.status);
        expect(component.showVideo).toBeTruthy();
        expect(component.isAdminConsultation).toBeFalsy();
    }));

    it('should update non logged in participant status to in consultation', fakeAsync(() => {
        const status = ParticipantStatus.InConsultation;
        const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
        const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);
        component.connected = true;
        component.participant.status = ParticipantStatus.Available;
        participantStatusSubject.next(message);
        flushMicrotasks();

        const postUpdateParticipant = component.hearing.getConference().participants.find(p => p.id === message.participantId);
        expect(postUpdateParticipant.status).toBe(message.status);
        expect(component.showVideo).toBeFalsy();
    }));

    it('should get conference when disconnected from eventhub less than 7 times', fakeAsync(() => {
        component.participant.status = ParticipantStatus.InHearing;
        component.conference.status = ConferenceStatus.InSession;

        const newParticipantStatus = ParticipantStatus.InConsultation;
        const newConferenceStatus = ConferenceStatus.Paused;
        const newConference = new ConferenceResponse(Object.assign({}, globalConference));
        newConference.status = newConferenceStatus;
        newConference.participants.find(x => x.id === globalParticipant.id).status = newParticipantStatus;
        component.loggedInUser = logged;

        videoWebService.getConferenceById.and.resolveTo(newConference);
        videoWebService.getAllowedEndpointsForConference.and.resolveTo([]);

        eventHubDisconnectSubject.next(1);
        eventHubDisconnectSubject.next(2);
        eventHubDisconnectSubject.next(3);
        eventHubDisconnectSubject.next(4);
        eventHubDisconnectSubject.next(5);
        eventHubDisconnectSubject.next(6);

        flushMicrotasks();
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(6);
        expect(videoWebService.getAllowedEndpointsForConference).toHaveBeenCalledTimes(6);
        expect(component.participant.status).toBe(newParticipantStatus);
        expect(component.conference.status).toBe(newConferenceStatus);
        expect(component.conference).toEqual(newConference);
    }));

    it('should go to service error when disconnected from eventhub more than 7 times', () => {
        eventHubDisconnectSubject.next(8);
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(0);
    });

    it('should get conference on eventhub reconnect', () => {
        videoWebService.getConferenceById.calls.reset();
        errorService.goToServiceError.calls.reset();
        eventHubReconnectSubject.next();
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(1);
    });

    it('should update conference status and not show video when "in session" message received and participant is a witness', fakeAsync(() => {
        component.participant = globalWitness;
        const status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(globalConference.id, status);
        notificationSoundsService.playHearingAlertSound.calls.reset();

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
    }));

    it('should ignore endpoint updates for another conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, Guid.create().toString(), status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.status === message.status).toBeFalsy();
    }));

    it('should ignore endpoint updates for not in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(Guid.create().toString(), globalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoints = component.hearing.getEndpoints().filter(x => x.status === status);
        expect(endpoints.length).toBe(0);
    }));

    it('should update endpoint in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, globalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.status === message.status).toBeTruthy();
    }));

    it('should set room to null on disconnect for endpoint in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, globalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.current_room).toBeNull();
    }));

    it('should update existing conference room to be locked', fakeAsync(() => {
        const payload = new Room('ConsultationRoom', false);
        component.conferenceRooms.push(payload);
        const countRoom = component.conferenceRooms.length;
        payload.locked = true;
        roomUpdateSubjectMock.next(payload);
        flushMicrotasks();

        expect(component.conferenceRooms.length).toBe(countRoom);
        expect(component.conferenceRooms.find(x => x.label === 'ConsultationRoom').locked).toBe(true);
    }));

    it('should update by adding conference room', fakeAsync(() => {
        const payload = new Room('HearingRoom', false);
        const countRoom = component.conferenceRooms.length;
        roomUpdateSubjectMock.next(payload);
        flushMicrotasks();

        expect(component.conferenceRooms.length).toBeGreaterThan(countRoom);
        expect(component.conferenceRooms.find(x => x.label === 'HearingRoom').locked).toBe(false);
    }));

    it('should transfer existing participant to conference room', fakeAsync(() => {
        const payload = new RoomTransfer(globalParticipant.id, 'ConsultationRoom_to', 'ConsultationRoom_from');
        roomTransferSubjectMock.next(payload);
        flushMicrotasks();

        expect(globalParticipant.current_room.label).toBe('ConsultationRoom_to');
    }));

    it('should set null room for waiting room transfer', fakeAsync(() => {
        const payload = new RoomTransfer(globalParticipant.id, 'WaitingRoom', 'ConsultationRoom_from');
        roomTransferSubjectMock.next(payload);
        flushMicrotasks();

        expect(globalParticipant.current_room).toBeNull();
    }));

    it('should set room label for consultation room transfer', fakeAsync(() => {
        const payload = new RoomTransfer(globalParticipant.id, 'ConsultationRoom_to', 'ConsultationRoom_from');
        roomTransferSubjectMock.next(payload);
        flushMicrotasks();

        expect(globalParticipant.current_room?.label).toEqual('ConsultationRoom_to');
    }));

    it('should set null room for hearing transfer', fakeAsync(() => {
        const payload = new RoomTransfer(globalParticipant.id, 'HearingRoom_to', 'HearingRoom_from');
        roomTransferSubjectMock.next(payload);
        flushMicrotasks();

        expect(globalParticipant.current_room).toBeNull();
    }));

    it('should set property to true when countdown is complete for hearing', () => {
        component.countdownComplete = false;
        const videoElement = document.createElement('video');
        videoElement.muted = true;
        const elemRef = new ElementRef(videoElement);
        component.videoStream = elemRef;

        hearingCountdownCompleteSubjectMock.next(component.conferenceId);

        expect(component.countdownComplete).toBeTruthy();
        expect(component.videoStream.nativeElement.muted).toBeFalsy();
    });

    it('should ignore countdown complete for another hearing', () => {
        component.countdownComplete = false;
        const videoElement = document.createElement('video');
        videoElement.muted = true;
        const elemRef = new ElementRef(videoElement);
        component.videoStream = elemRef;

        hearingCountdownCompleteSubjectMock.next(Guid.create().toString());

        expect(component.countdownComplete).toBeFalsy();
        expect(component.videoStream.nativeElement.muted).toBeTruthy();
    });

    describe('createOrUpdateWaitingOnLinkedParticipantsNotification', () => {
        beforeEach(() => {
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
        });

        const expectedConsultationRoomLabel = 'ConsultationRoom';
        const expectedInvitedByName = 'Invited By Name';
        it('should raise a toast if there are linked participants who have NOT accepted their invitation', () => {
            // Arramge
            const invitation = new ConsultationInvitation();
            invitation.invitedByName = expectedInvitedByName;
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : false, 'lp3' : false, 'lp4' : true });
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
            findParticipantSpy.and.returnValues({display_name: 'lp2'}, {display_name: 'lp3'});

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).toHaveBeenCalledTimes(2);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(expectedLinkedParticipantsWhoHaventAccepted, expectedInvitedByName, true);
            expect(invitation.activeToast).toBe(expectedToastSpy);
        });

        it('should close an existing toast before raising a new toast', () => {
            // Arramge
            const invitation = new ConsultationInvitation();
            invitation.invitedByName = expectedInvitedByName;
            const toastSpy = invitation.activeToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : false, 'lp3' : false, 'lp4' : true });
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : false, 'lp3' : false, 'lp4' : true });
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
            findParticipantSpy.and.returnValues({display_name: 'lp2'}, {display_name: 'lp3'});

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).toHaveBeenCalledTimes(2);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
            expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(expectedLinkedParticipantsWhoHaventAccepted, expectedInvitedByName, true);
            expect(invitation.activeToast).toBe(expectedToastSpy);
            expect(toastSpy.remove).toHaveBeenCalledTimes(1);
        });

        it('should NOT raise a toast if there are NO linked participants who have NOT accepted their invitation', () => {
            // Arramge
            const invitation = new ConsultationInvitation();
            invitation.invitedByName = expectedInvitedByName;
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : true, 'lp3' : true, 'lp4' : true });
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
            findParticipantSpy.and.returnValues({display_name: 'lp2'}, {display_name: 'lp3'});

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).not.toHaveBeenCalled();
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
            expect(invitation.activeToast).toBeNull();
        });

        it('should NOT raise a toast if there are NO linked participants', () => {
            // Arramge
            const invitation = new ConsultationInvitation();
            invitation.invitedByName = expectedInvitedByName;
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({});
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
            findParticipantSpy.and.returnValues({display_name: 'lp2'}, {display_name: 'lp3'});

            const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

            // Assert
            expect(findParticipantSpy).not.toHaveBeenCalled();
            expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
            expect(invitation.activeToast).toBeNull();
        });
    });

    describe('onConsultationAccepted', () => {
        beforeEach(() => {
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
            consultationInvitiationService.getInvitation.calls.reset();
        });

        const expectedConsultationRoomLabel = 'ConsultationRoom';
        it('should call createOrUpdateWaitingOnLinkedParticipantsNotification and set the activeParticipantAccepted to true', () => {
            // Arrange
            const invitation = new ConsultationInvitation();
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : false, 'lp3' : false, 'lp4' : true });
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

            const findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
            findParticipantSpy.and.returnValues({display_name: 'lp2'}, {display_name: 'lp3'});

            spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');
            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.onConsultationAccepted(expectedConsultationRoomLabel);

            // Assert
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledTimes(1);
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledWith(expectedConsultationRoomLabel);
            expect(invitation.activeParticipantAccepted).toBeTrue();
            expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
        });
    });

    describe('onTransferingToConsultation', () => {
        const expectedConsultationRoomLabel = 'ConsultationRoom';
        it('should remove the active toast and delete the invitation from the consultation invitation service', () => {
            // Arrange

            // Act
            component.onTransferingToConsultation(expectedConsultationRoomLabel);

            // Assert
            expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
        });
    });

    describe('onLinkedParticiantRejectedConsultationInvite', () => {
        const linkedParticipant = participantsLinked[1];
        const expectedConsultationRoomLabel = 'ConsultationRoom';
        const expectedInvitedByName = 'invited by';
        const toastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);

        beforeEach(() => {
            notificationToastrService.showConsultationRejectedByLinkedParticipant.calls.reset();
            consultationInvitiationService.getInvitation.calls.reset();
            consultationInvitiationService.removeInvitation.calls.reset();

            toastSpy.declinedByThirdParty = false;
            const invitationSpy = jasmine.createSpyObj<ConsultationInvitation>('ConsultationInvitation', ['addLinkedParticipant'], ['activeToast', 'invitedByName']);
            spyPropertyGetter(invitationSpy, 'activeToast').and.returnValue(toastSpy);
            spyPropertyGetter(invitationSpy, 'invitedByName').and.returnValue(expectedInvitedByName);
            consultationInvitiationService.getInvitation.and.returnValue(invitationSpy);
        });

        it('should remove the existing toast for a room if it exists when is NOT in hearing', () => {
            // Arrange
            const expectedIsParticipantInHearing = true;
            component.participant.status = ParticipantStatus.InHearing;

            // Act
            component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant.display_name, expectedConsultationRoomLabel);

            // Assert
            expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedInvitedByName, expectedIsParticipantInHearing);
            expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(toastSpy.declinedByThirdParty).toBeTrue();
        });

        it('should remove the existing toast for a room if it exists when is NOT in hearing', () => {
            // Arrange
            const expectedIsParticipantInHearing = false;
            component.participant.status = ParticipantStatus.Available;

            // Act
            component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant.display_name, expectedConsultationRoomLabel);

            // Assert
            expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedInvitedByName, expectedIsParticipantInHearing);
            expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(toastSpy.declinedByThirdParty).toBeTrue();
        });
    });

    describe('onLinkedParticiantAcceptedConsultationInvite', () => {
        const primaryParticipant = participantsLinked[0];
        const linkedParticipant = participantsLinked[1];
        const expectedConsultationRoomLabel = 'ConsultationRoom';

        beforeEach(() => {
            notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
            consultationInvitiationService.getInvitation.calls.reset();
        });

        it('should update the participant status and the toast notification for the invitation if there are still linked participants who havent accepted and the active participant has accepted', () => {
            // Arrange
            const invitation = new ConsultationInvitation();
            invitation.activeParticipantAccepted = true;
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : true, 'lp3' : true, 'lp4' : true });
            spyOn(invitation, 'updateLinkedParticipantStatus');
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

            // Act
            component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

            // Assert
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(invitation.updateLinkedParticipantStatus).toHaveBeenCalledOnceWith(linkedParticipant.id, true);
            expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
        });

        it('should NOT update the toast notification for the invitation if the active participant has NOT accepted', () => {
            // Arrange
            const invitation = new ConsultationInvitation();
            invitation.activeParticipantAccepted = false;
            spyOnProperty(invitation, 'linkedParticipantStatuses', 'get').and.returnValue({ 'lp1' : true, 'lp2' : true, 'lp3' : true, 'lp4' : true });
            spyOn(invitation, 'updateLinkedParticipantStatus');
            consultationInvitiationService.getInvitation.and.returnValue(invitation);

            spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

            // Act
            component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

            // Assert
            expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
            expect(invitation.updateLinkedParticipantStatus).toHaveBeenCalledOnceWith(linkedParticipant.id, true);
            expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).not.toHaveBeenCalled();
        });
    });

    describe('on recieve getRequestedConsultationMessage from the event hub', () => {
        beforeEach(() => {
            consultationInvitiationService.createInvitation.calls.reset();
        });

        const primaryParticipant = participantsLinked[0];
        const linkedParticipant = participantsLinked[1];
        const requestor = globalConference.participants.find(x => x.id !== primaryParticipant.id && x.id !== linkedParticipant.id);
        const expectedConsultationRoomLabel = 'ConsultationRoom';
        const expectedInvitedByName = requestor.display_name;

        it('should try to add all linked participants into the invitation', fakeAsync(() => {
            // Arrange
            const invitation = new ConsultationInvitation();
            spyOn(invitation, 'addLinkedParticipant');
            invitation.invitedByName = null;
            consultationInvitiationService.createInvitation.and.returnValue(invitation);

            const expectedToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showConsultationInvite.and.returnValue(expectedToast);

            const payload = new RequestedConsultationMessage(globalConference.id, 'ConsultationRoom', requestor.id, primaryParticipant.id);

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValues(new ParticipantResponse(primaryParticipant), new ParticipantResponse(requestor));
            component.participant = primaryParticipant;

            // Act
            requestedConsultationMessageSubjectMock.next(payload);
            flush();

            // Assert
            expect(notificationToastrService.showConsultationInvite).toHaveBeenCalled();
            expect(consultationInvitiationService.createInvitation).toHaveBeenCalledWith(expectedConsultationRoomLabel, expectedInvitedByName);
            expect(invitation.addLinkedParticipant).toHaveBeenCalledOnceWith(linkedParticipant.id);
            expect(invitation.activeToast).toBe(expectedToast);
        }));
    });

    describe('onConsultationRejected', () => {
        const expectedConsultationRoomLabel = 'ConsultationRoom';

        beforeEach(() => {
            consultationInvitiationService.removeInvitation.calls.reset();
        });

        it('should call removeInvitation for the room that was rejected', () => {
            // Arrange

            // Act
            component.onConsultationRejected(expectedConsultationRoomLabel);

            // Assert
            expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
        });
    });

    describe('on recieve getConsultationRequestResponseMessage from the event hub', () => {
        const primaryParticipant = participantsLinked[0];
        const linkedParticipant = participantsLinked[1];
        const expectedConsultationRoomLabel = 'ConsultationRoom';

        it('should call onConsultationRejected when the active participant rejects the invitation', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                globalParticipant.id,
                ConsultationAnswer.Rejected,
                true
            );

            spyOn(component, 'onConsultationRejected');
            component.participant = globalParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationRejected).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
        });

        it('should NOT raise any toasts if the request was not raised directly by the linked participants client', () => {
            // Arrange
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected,
                false
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onConsultationAccepted');
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalled();
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should NOT raise any toasts if the participant is NOT linked and is NOT the current participant', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                Guid.create().toString(),
                ConsultationAnswer.Accepted,
                true
            );

            spyOn(component, 'onConsultationAccepted');
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalled();
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should NOT raise any toasts if the linked participant accepted the consultation invite', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Accepted,
                true
            );

            spyOn(component, 'onConsultationAccepted');
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalled();
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should call onLinkedParticiantAcceptedConsultationInvite if a linked participant accepts the consultation invitation', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Accepted,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onLinkedParticiantAcceptedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantAcceptedConsultationInvite).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel, linkedParticipant.id);
        });

        it('should raise a toast if a linked participant rejected the consultation request', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it('should NOT raise a toast if a linked participant responed to the consultation request with transferring', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Transferring,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // TODO: Update with expected behaviour
            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should raise a toast if a linked participant responed to the consultation request with none', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.None,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it('should raise a toast if a linked participant\'s consultation request failed', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Failed,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it('should call onLinkedParticiantRejectedConsultationInvite when a linked participant rejects the request', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected,
                true
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            component.participant = primaryParticipant;

            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it('should NOT call onConsulationRejected when it was not sent by client who rejected the request', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected,
                false
            );

            component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
            component.participant = primaryParticipant;

            spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should close start and join modal set preferred devices when participant accepts consultation', fakeAsync(async () => {
            component.displayDeviceChangeModal = true;
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                'ConsultationRoom',
                globalParticipant.id,
                ConsultationAnswer.Accepted,
                true
            );
            component.participant = globalParticipant;
            consultationRequestResponseMessageSubject.next(message);
            tick();
            expect(component.displayStartPrivateConsultationModal).toBeFalsy();
            expect(component.displayJoinPrivateConsultationModal).toBeFalsy();
            expect(userMediaService.getPreferredCamera).toHaveBeenCalled();
            expect(userMediaService.getPreferredMicrophone).toHaveBeenCalled();
            expect(userMediaStreamService.getStreamForCam).toHaveBeenCalled();
            expect(userMediaStreamService.getStreamForMic).toHaveBeenCalled();
            expect(component.displayDeviceChangeModal).toBeFalsy();
        }));

        it('should call onTransferingToConsultation if a transfering message is recieved for the active participant', () => {
            // Arrange
            spyOn(component, 'onTransferingToConsultation');

            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                globalParticipant.id,
                ConsultationAnswer.Transferring,
                true
            );

            component.participant = globalParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onTransferingToConsultation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
        });
    });
});
