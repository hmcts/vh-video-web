import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
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

describe('WaitingRoomComponent EventHub Call', () => {
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
            clockService
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

    it('should receive requested consultation message', fakeAsync(() => {
        const requestedby = globalConference.participants.find(x => x.id !== globalParticipant.id);
        const payload = new RequestedConsultationMessage(globalConference.id, 'ConsultationRoom', requestedby.id, globalParticipant.id);
        requestedConsultationMessageSubjectMock.next(payload);
        flushMicrotasks();

        expect(notificationToastrService.showConsultationInvite).toHaveBeenCalled();
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

    describe('onLinkedParticiantRejectedConsultationInvite', () => {
        const linkedParticipant = participantsLinked[1];
        const expectedConsultationRoomLabel = 'ConsultationRoom';

        it('should remove the existing toast for a room if it exists', () => {
            // Arrange
            const toastSpy = jasmine.createSpyObj<VhToastComponent>("VhToastComponent", ["remove"]);
            component.consultationInviteToasts[expectedConsultationRoomLabel] = toastSpy;

            // Act
            component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant.display_name, expectedConsultationRoomLabel);

            // Assert
            expect(toastSpy.remove).toHaveBeenCalledTimes(1);
            expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });
    });

    describe('on recieve getConsultationRequestResponseMessage from the event hub', () => {
        const primaryParticipant = participantsLinked[0];
        const linkedParticipant = participantsLinked[1];
        const expectedConsultationRoomLabel = 'ConsultationRoom';

        fit('should NOT raise linked participant rejected inviation when the linked participant is this participant', () => {
            // Arrange
            const linkedRejection = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected
            );

            const primaryRejection = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                primaryParticipant.id,
                ConsultationAnswer.Rejected
            );

            spyOn(component, "onConsultationAccepted");
            spyOn(component, "onConsultationRejected");
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(linkedRejection);
            consultationRequestResponseMessageSubject.next(primaryRejection);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalledTimes(1);
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should NOT raise any toasts if the participant is NOT linked and is NOT the current participant', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                Guid.create().toString(),
                ConsultationAnswer.Accepted
            );

            spyOn(component, "onConsultationAccepted");
            spyOn(component, "onConsultationRejected");
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalled();
            expect(component.onConsultationRejected).not.toHaveBeenCalled();
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it('should NOT raise any toasts if the linked participant accepted the consultation invite', () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Accepted
            );

            spyOn(component, "onConsultationAccepted");
            spyOn(component, "onConsultationRejected");
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onConsultationAccepted).not.toHaveBeenCalled();
            expect(component.onConsultationRejected).not.toHaveBeenCalled();
            expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
        });

        it("should raise a toast if a linked participant rejected the consultation request", () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Rejected
            );

            component["findParticipant"] = jasmine.createSpy("findParticipant").and.returnValue(linkedParticipant);
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it("should raise a toast if a linked participant responed to the consultation request with transferring", () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Transferring
            );

            component["findParticipant"] = jasmine.createSpy("findParticipant").and.returnValue(linkedParticipant);
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // TODO: Update with expected behaviour
            // Assert
            // expect(component.onLinkedParticiapntRejectedConsultationInvite).toHaveBeenCalledTimes(1);
        });

        it("should raise a toast if a linked participant responed to the consultation request with none", () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.None
            );

            component["findParticipant"] = jasmine.createSpy("findParticipant").and.returnValue(linkedParticipant);
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it("should raise a toast if a linked participant's consultation request failed", () => {
            // Arrange
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                expectedConsultationRoomLabel,
                linkedParticipant.id,
                ConsultationAnswer.Failed
            );

            component["findParticipant"] = jasmine.createSpy("findParticipant").and.returnValue(linkedParticipant);
            spyOn(component, "onLinkedParticiantRejectedConsultationInvite");
            component.participant = primaryParticipant;

            // Act
            consultationRequestResponseMessageSubject.next(message);

            // Assert
            expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(linkedParticipant.display_name, expectedConsultationRoomLabel);
        });

        it('should not set preferred devices when participant has rejected consultation', fakeAsync(async () => {
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                'ConsultationRoom',
                globalParticipant.id,
                ConsultationAnswer.Rejected
            );
            consultationRequestResponseMessageSubject.next(message);
            flushMicrotasks();
            expect(component.isAdminConsultation).toBeFalsy();
            expect(userMediaService.getPreferredCamera).toHaveBeenCalledTimes(0);
            expect(userMediaService.getPreferredMicrophone).toHaveBeenCalledTimes(0);
            expect(userMediaStreamService.getStreamForCam).toHaveBeenCalledTimes(0);
            expect(userMediaStreamService.getStreamForMic).toHaveBeenCalledTimes(0);
        }));

        it('should set consultation toast to rejected', fakeAsync(() => {
            const roomLabel = 'ConsultationRoom';
            const toast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            component.consultationInviteToasts[roomLabel] = toast;
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                roomLabel,
                globalParticipant.id,
                ConsultationAnswer.Rejected
            );
            consultationRequestResponseMessageSubject.next(message);
            flushMicrotasks();
            const updatedToast = component.consultationInviteToasts[roomLabel];
            expect(updatedToast.declinedByThirdParty).toBeTruthy();
        }));

        it('should close start and join modal set preferred devices when participant accepts consultation', fakeAsync(async () => {
            component.displayDeviceChangeModal = true;
            const message = new ConsultationRequestResponseMessage(
                globalConference.id,
                'ConsultationRoom',
                globalParticipant.id,
                ConsultationAnswer.Accepted
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
    });
});
