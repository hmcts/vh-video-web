import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    RoomType
} from 'src/app/services/clients/api-client';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import {
    adminConsultationMessageSubjectMock,
    consultationMessageSubjectMock,
    endpointStatusSubjectMock,
    eventHubDisconnectSubjectMock,
    eventHubReconnectSubjectMock,
    hearingStatusSubjectMock,
    hearingTransferSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import {
    activatedRoute,
    adalService,
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
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';

describe('WaitingRoomComponent EventHub Call', () => {
    let component: WRTestComponent;

    const participantStatusSubject = participantStatusSubjectMock;
    const hearingStatusSubject = hearingStatusSubjectMock;
    const adminConsultationMessageSubject = adminConsultationMessageSubjectMock;
    const eventHubDisconnectSubject = eventHubDisconnectSubjectMock;
    const eventHubReconnectSubject = eventHubReconnectSubjectMock;
    const hearingTransferSubject = hearingTransferSubjectMock;
    const endpointStatusSubject = endpointStatusSubjectMock;
    const consultationMessageSubject = consultationMessageSubjectMock;

    beforeAll(() => {
        initAllWRDependencies();
    });

    beforeEach(async () => {
        component = new WRTestComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            clockService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        await component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscription$.unsubscribe();
        if (component.callbackTimeout) {
            clearTimeout(component.callbackTimeout);
        }
    });

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
    }));

    it('should update conference status and get closed time when "closed" message received', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const confWithCloseTime = new ConferenceResponse(Object.assign({}, globalConference));
        confWithCloseTime.closed_date_time = new Date();
        confWithCloseTime.status = status;
        videoWebService.getConferenceById.and.resolveTo(confWithCloseTime);

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
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.username, Guid.create().toString(), status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status === message.status).toBeFalsy();
    }));

    it('should update participant status to available', () => {
        const status = ParticipantStatus.Available;
        const message = new ParticipantStatusMessage(globalParticipant.id, globalParticipant.username, globalConference.id, status);

        participantStatusSubject.next(message);

        const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
        expect(participant.status).toBe(message.status);
        expect(component.isAdminConsultation).toBeFalsy();
        expect(component.showVideo).toBeFalsy();
    });

    it('should update logged in participant status to in consultation', () => {
        const status = ParticipantStatus.InConsultation;
        const participant = globalParticipant;
        const message = new ParticipantStatusMessage(participant.id, participant.username, globalConference.id, status);
        component.connected = true;

        participantStatusSubject.next(message);

        expect(component.participant.status).toBe(message.status);
        expect(component.showVideo).toBeTruthy();
        expect(component.isAdminConsultation).toBeFalsy();
    });

    it('should update non logged in participant status to in consultation', () => {
        const status = ParticipantStatus.InConsultation;
        const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
        const message = new ParticipantStatusMessage(participant.id, participant.username, globalConference.id, status);
        component.connected = true;
        component.participant.status = ParticipantStatus.Available;
        participantStatusSubject.next(message);

        const postUpdateParticipant = component.hearing.getConference().participants.find(p => p.id === message.participantId);
        expect(postUpdateParticipant.status).toBe(message.status);
        expect(component.showVideo).toBeFalsy();
    });

    it('should not set isAdminConsultation to true when participant has rejected admin consultation', () => {
        const message = new AdminConsultationMessage(
            globalConference.id,
            RoomType.ConsultationRoom1,
            globalParticipant.username,
            ConsultationAnswer.Rejected
        );
        adminConsultationMessageSubject.next(message);
        expect(component.isAdminConsultation).toBeFalsy();
    });

    it('should set isAdminConsultation to true when participant accepts admin consultation', () => {
        const message = new AdminConsultationMessage(
            globalConference.id,
            RoomType.ConsultationRoom1,
            globalParticipant.username,
            ConsultationAnswer.Accepted
        );
        adminConsultationMessageSubject.next(message);
        expect(component.isAdminConsultation).toBeTruthy();
    });

    it('should get conference when disconnected from eventhub less than 7 times', fakeAsync(() => {
        component.participant.status = ParticipantStatus.InHearing;
        component.conference.status = ConferenceStatus.InSession;

        const newParticipantStatus = ParticipantStatus.InConsultation;
        const newConferenceStatus = ConferenceStatus.Paused;
        const newConference = new ConferenceResponse(Object.assign({}, globalConference));
        newConference.status = newConferenceStatus;
        newConference.participants.find(x => x.id === globalParticipant.id).status = newParticipantStatus;

        videoWebService.getConferenceById.and.resolveTo(newConference);
        eventHubDisconnectSubject.next(1);
        eventHubDisconnectSubject.next(2);
        eventHubDisconnectSubject.next(3);
        eventHubDisconnectSubject.next(4);
        eventHubDisconnectSubject.next(5);
        eventHubDisconnectSubject.next(6);

        flushMicrotasks();
        expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(6);
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
        adalService.userInfo.userName = globalWitness.username;
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

    it('should updates endpoint in conference', fakeAsync(() => {
        const status = EndpointStatus.Disconnected;
        const message = new EndpointStatusMessage(globalEndpoint.id, globalConference.id, status);

        endpointStatusSubject.next(message);

        const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
        expect(endpoint.status === message.status).toBeTruthy();
    }));

    it('should close device selection modal and stop streams when consultation has been accepted', fakeAsync(() => {
        userMediaStreamService.getStreamForMic.calls.reset();
        userMediaStreamService.getStreamForCam.calls.reset();
        userMediaStreamService.stopStream.calls.reset();
        component.displayDeviceChangeModal = true;

        const requestedBy = globalConference.participants.filter(x => x.id !== component.participant.id)[0];
        const message = new ConsultationMessage(
            globalConference.id,
            requestedBy.username,
            component.participant.username,
            ConsultationAnswer.Accepted
        );
        consultationMessageSubject.next(message);
        flushMicrotasks();

        expect(component.displayDeviceChangeModal).toBe(false);
        expect(userMediaStreamService.getStreamForMic).toHaveBeenCalled();
        expect(userMediaStreamService.getStreamForCam).toHaveBeenCalled();
        expect(userMediaStreamService.stopStream).toHaveBeenCalledTimes(2);
    }));

    it('should not close device selection streams when device modal is not open when consultation has been accepted', fakeAsync(() => {
        userMediaStreamService.getStreamForMic.calls.reset();
        userMediaStreamService.getStreamForCam.calls.reset();
        userMediaStreamService.stopStream.calls.reset();
        component.displayDeviceChangeModal = false;

        const requestedBy = globalConference.participants.filter(x => x.id !== component.participant.id)[0];
        const message = new ConsultationMessage(
            globalConference.id,
            requestedBy.username,
            component.participant.username,
            ConsultationAnswer.Accepted
        );
        consultationMessageSubject.next(message);

        expect(component.displayDeviceChangeModal).toBe(false);
        expect(userMediaStreamService.getStreamForMic).toHaveBeenCalledTimes(0);
        expect(userMediaStreamService.getStreamForCam).toHaveBeenCalledTimes(0);
        expect(userMediaStreamService.stopStream).toHaveBeenCalledTimes(0);
    }));

    it('should ignore non accepted consultation messages', fakeAsync(() => {
        spyOn(component, 'onConsultationAccepted');

        const requestedBy = globalConference.participants.filter(x => x.id !== component.participant.id)[0];
        const message = new ConsultationMessage(
            globalConference.id,
            requestedBy.username,
            component.participant.username,
            ConsultationAnswer.Rejected
        );
        consultationMessageSubject.next(message);

        expect(component.onConsultationAccepted).toHaveBeenCalledTimes(0);
    }));
});
