// import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
// import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
// import { Guid } from 'guid-typescript';
// import {
//     ConferenceResponse,
//     ConferenceStatus,
//     ConsultationAnswer,
//     LoggedParticipantResponse,
//     EndpointStatus,
//     ParticipantResponse,
//     ParticipantStatus,
//     RoomSummaryResponse,
//     HearingLayout,
//     Role,
//     VideoEndpointResponse
// } from 'src/app/services/clients/api-client';
// import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
// import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
// import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
// import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
// import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
// import { Hearing } from 'src/app/shared/models/hearing';
// import {
//     consultationRequestResponseMessageSubjectMock,
//     requestedConsultationMessageSubjectMock,
//     endpointStatusSubjectMock,
//     eventHubDisconnectSubjectMock,
//     eventHubReconnectSubjectMock,
//     hearingStatusSubjectMock,
//     hearingTransferSubjectMock,
//     participantStatusSubjectMock,
//     onEventsHubReadySubjectMock,
//     getParticipantsUpdatedSubjectMock,
//     getEndpointsUpdatedMessageSubjectMock,
//     getHearingDetailsUpdatedMock
// } from 'src/app/testing/mocks/mock-events-service';
// import {
//     clockService,
//     consultationInvitiationService,
//     consultationService,
//     deviceTypeService,
//     errorService,
//     eventsService,
//     globalConference,
//     globalEndpoint,
//     globalParticipant,
//     globalWitness,
//     initAllWRDependencies,
//     logger,
//     notificationSoundsService,
//     notificationToastrService,
//     participantsLinked,
//     roomClosingToastrService,
//     router,
//     videoWebService,
//     videoCallService,
//     titleService,
//     mockConferenceStore,
//     launchDarklyService
// } from './waiting-room-base-setup';
// import { WRTestComponent } from './WRTestComponent';
// import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
// import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
// import { ConsultationInvitation, ConsultationInvitationService } from '../../services/consultation-invitation.service';
// import { VideoWebService } from 'src/app/services/api/video-web.service';
// import { EventsService } from 'src/app/services/events.service';
// import { Logger } from 'src/app/services/logging/logger-base';
// import { ErrorService } from 'src/app/services/error.service';
// import { VideoCallService } from '../../services/video-call.service';
// import { DeviceTypeService } from 'src/app/services/device-type.service';
// import { ConsultationService } from 'src/app/services/api/consultation.service';
// import { NotificationSoundsService } from '../../services/notification-sounds.service';
// import { NotificationToastrService } from '../../services/notification-toastr.service';
// import { RoomClosingToastrService } from '../../services/room-closing-toast.service';
// import { ClockService } from 'src/app/services/clock.service';
// import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
// import { EndpointsUpdatedMessage } from 'src/app/shared/models/endpoints-updated-message';
// import { UpdateEndpointsDto } from 'src/app/shared/models/update-endpoints-dto';
// import { HearingLayoutChanged } from 'src/app/services/models/hearing-layout-changed';
// import { vhContactDetails } from 'src/app/shared/contact-information';
// import { Title } from '@angular/platform-browser';
// import { provideMockStore } from '@ngrx/store/testing';
// import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
// import { of } from 'rxjs';
// import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';
// import * as ConferenceSelectors from '../../store/selectors/conference.selectors';
// import { mapConferenceToVHConference } from '../../store/models/api-contract-to-state-model-mappers';
// import { cold } from 'jasmine-marbles';

// describe('WaitingRoomComponent EventHub Call', () => {
//     let fixture: ComponentFixture<WRTestComponent>;
//     let component: WRTestComponent;

//     const participantStatusSubject = participantStatusSubjectMock;
//     const hearingStatusSubject = hearingStatusSubjectMock;
//     const consultationRequestResponseMessageSubject = consultationRequestResponseMessageSubjectMock;
//     const requestedConsultationMessageSubject = requestedConsultationMessageSubjectMock;
//     const eventHubDisconnectSubject = eventHubDisconnectSubjectMock;
//     const hearingTransferSubject = hearingTransferSubjectMock;
//     const endpointStatusSubject = endpointStatusSubjectMock;
//     const invitationId = Guid.create().toString();
//     let logged: LoggedParticipantResponse;
//     let activatedRoute: ActivatedRoute;

//     beforeAll(() => {
//         initAllWRDependencies();
//     });

//     afterAll(() => {
//         mockConferenceStore.resetSelectors();
//     });

//     beforeEach(async () => {
//         launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.instantMessaging, false).and.returnValue(of(true));
//         logged = new LoggedParticipantResponse({
//             participant_id: globalParticipant.id,
//             display_name: globalParticipant.display_name,
//             role: globalParticipant.role
//         });
//         activatedRoute = <any>{
//             snapshot: { data: { loggedUser: logged }, paramMap: convertToParamMap({ conferenceId: globalConference.id }) }
//         };

//         const conference = new ConferenceResponse(Object.assign({}, globalConference));
//         const participant = new ParticipantResponse(Object.assign({}, globalParticipant));

//         mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, mapConferenceToVHConference(conference));
//         mockConferenceStore.overrideSelector(ConferenceSelectors.getAvailableRooms, []);

//         TestBed.configureTestingModule({
//             declarations: [WRTestComponent],
//             providers: [
//                 { provide: ActivatedRoute, useValue: activatedRoute },
//                 { provide: VideoWebService, useValue: videoWebService },
//                 { provide: EventsService, useValue: eventsService },
//                 { provide: Logger, useValue: logger },
//                 { provide: ErrorService, useValue: errorService },
//                 { provide: VideoCallService, useValue: videoCallService },
//                 { provide: DeviceTypeService, useValue: deviceTypeService },
//                 { provide: Router, useValue: router },
//                 { provide: ConsultationService, useValue: consultationService },
//                 { provide: NotificationSoundsService, useValue: notificationSoundsService },
//                 { provide: NotificationToastrService, useValue: notificationToastrService },
//                 { provide: RoomClosingToastrService, useValue: roomClosingToastrService },
//                 { provide: ClockService, useValue: clockService },
//                 { provide: ConsultationInvitationService, useValue: consultationInvitiationService },
//                 { provide: Title, useValue: titleService },
//                 { provide: LaunchDarklyService, useValue: launchDarklyService },
//                 provideMockStore()
//             ]
//         });
//         fixture = TestBed.createComponent(WRTestComponent);
//         component = fixture.componentInstance;

//         component.hearing = new Hearing(conference);
//         component.conference = conference;
//         component.participant = participant;
//         component.connected = true; // assume connected to pexip
//         await component.startEventHubSubscribers();
//         videoWebService.getConferenceById.calls.reset();
//         videoCallService.stopScreenShare.calls.reset();
//     });

//     afterEach(() => {
//         component.eventHubSubscription$.unsubscribe();
//         if (component.callbackTimeout) {
//             clearTimeout(component.callbackTimeout);
//         }
//         mockConferenceStore.resetSelectors();
//     });

//     describe('event hub status changes', () => {
//         beforeEach(fakeAsync(() => {
//             spyOn(component, 'loadConferenceAndUpdateVideo');
//             spyOn(component, 'setupPexipEventSubscriptionAndClient');
//             component.connectToPexip();
//             flush();
//         }));

//         afterEach(() => {
//             expect(component.loadConferenceAndUpdateVideo).toHaveBeenCalledTimes(1);
//         });

//         it('should call and update video when event hub is ready', fakeAsync(() => {
//             onEventsHubReadySubjectMock.next(true);
//         }));

//         it('should call and update video when event hub reconnects', async () => {
//             eventHubReconnectSubjectMock.next(true);
//         });
//     });

//     it('loadConferenceAndUpdateVideo', done => {
//         spyOn(component, 'getConference').and.returnValue(Promise.resolve());
//         spyOn(component, 'updateShowVideo');

//         component.loadConferenceAndUpdateVideo().then(res => {
//             expect(component.getConference).toHaveBeenCalledTimes(1);
//             expect(component.updateShowVideo).toHaveBeenCalledTimes(1);
//             done();
//         });
//     });

//     it('should not display vho consultation request when participant is unavailable', fakeAsync(() => {
//         component.participant.status = ParticipantStatus.InHearing;
//         const payload = new RequestedConsultationMessage(
//             component.conference.id,
//             invitationId,
//             'AdminRoom',
//             Guid.EMPTY,
//             component.participant.id
//         );

//         requestedConsultationMessageSubject.next(payload);
//         flushMicrotasks();

//         expect(notificationToastrService.showConsultationInvite).toHaveBeenCalledTimes(0);
//     }));

//     it('should update transferring in when inTransfer message has been received', fakeAsync(() => {
//         const transferDirection = TransferDirection.In;
//         const payload = new HearingTransfer(globalConference.id, globalParticipant.id, transferDirection);
//         hearingTransferSubject.next(payload);
//         flushMicrotasks();

//         expect(component.isTransferringIn).toBeTruthy();
//     }));

//     it('should not update transferring in when inTransfer message has been received and participant is not current user', fakeAsync(() => {
//         const transferDirection = TransferDirection.In;
//         const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
//         const payload = new HearingTransfer(globalConference.id, participant.id, transferDirection);

//         hearingTransferSubject.next(payload);
//         flushMicrotasks();

//         expect(component.isTransferringIn).toBeFalsy();
//     }));

//     it('should not update transferring in when inTransfer message has been received and is for a different conference', fakeAsync(() => {
//         const transferDirection = TransferDirection.In;
//         const payload = new HearingTransfer(Guid.create().toString(), globalParticipant.id, transferDirection);

//         hearingTransferSubject.next(payload);
//         flushMicrotasks();

//         expect(component.isTransferringIn).toBeFalsy();
//     }));

//     it('should ignore conference updates for another conference', fakeAsync(() => {
//         const status = ConferenceStatus.Closed;
//         const message = new ConferenceStatusMessage(Guid.create().toString(), status);
//         component.hearing.getConference().status = ConferenceStatus.InSession;
//         hearingStatusSubject.next(message);
//         flushMicrotasks();

//         expect(component.hearing.status).toBe(ConferenceStatus.InSession);
//     }));

//     it('should update conference status and show video when "in session" message received and participant is not a witness', fakeAsync(() => {
//         const status = ConferenceStatus.InSession;
//         const message = new ConferenceStatusMessage(globalConference.id, status);
//         component.conferenceStartedBy = component.participant.id;
//         component.participant.status = ParticipantStatus.InHearing;

//         notificationSoundsService.playHearingAlertSound.calls.reset();
//         hearingStatusSubject.next(message);
//         tick();
//         flushMicrotasks();

//         expect(videoCallService.stopScreenShare).toHaveBeenCalledTimes(1);
//         expect(component.hearing.status).toBe(status);
//         expect(component.conference.status).toBe(status);
//         expect(component.showVideo).toBeTruthy();
//         expect(component.countdownComplete).toBeFalsy();
//     }));

//     it('should update conference status and get closed time when "closed" message received', fakeAsync(() => {
//         const status = ConferenceStatus.Closed;
//         const confWithCloseTime = new ConferenceResponse(Object.assign({}, globalConference));
//         confWithCloseTime.closed_date_time = new Date();
//         confWithCloseTime.status = status;
//         videoWebService.getConferenceById.and.resolveTo(confWithCloseTime);
//         component.loggedInUser = logged;
//         const message = new ConferenceStatusMessage(globalConference.id, status);

//         hearingStatusSubject.next(message);
//         tick();
//         flushMicrotasks();

//         expect(component.hearing.status).toBe(status);
//         expect(component.conference.status).toBe(status);
//         expect(component.showVideo).toBeFalsy();
//         expect(videoCallService.stopScreenShare).toHaveBeenCalledTimes(1);
//         expect(videoWebService.getConferenceById).toHaveBeenCalledWith(globalConference.id);
//     }));

//     it('should ignore participant updates for another conference', fakeAsync(() => {
//         const status = ParticipantStatus.Disconnected;
//         const message = new ParticipantStatusMessage(globalParticipant.id, '', Guid.create().toString(), status);

//         participantStatusSubject.next(message);

//         const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
//         expect(participant.status === message.status).toBeFalsy();
//     }));

//     it('should update participant status to available', fakeAsync(() => {
//         const status = ParticipantStatus.Available;
//         const message = new ParticipantStatusMessage(globalParticipant.id, '', globalConference.id, status);

//         participantStatusSubject.next(message);
//         flushMicrotasks();

//         const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
//         expect(participant.status).toBe(message.status);
//         expect(component.isAdminConsultation).toBeFalsy();
//         expect(component.showVideo).toBeFalsy();
//     }));

//     it('should set room to null on disconnect for participant in conference', fakeAsync(() => {
//         const status = ParticipantStatus.Disconnected;
//         const message = new ParticipantStatusMessage(globalParticipant.id, '', globalConference.id, status);

//         participantStatusSubject.next(message);

//         const participant = component.hearing.getConference().participants.find(x => x.id === message.participantId);
//         expect(participant.current_room).toBeNull();
//     }));

//     it('should update logged in participant status to in consultation', fakeAsync(() => {
//         const status = ParticipantStatus.InConsultation;
//         const participant = globalParticipant;
//         const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);
//         component.connected = true;

//         participantStatusSubject.next(message);
//         flushMicrotasks();

//         expect(component.participant.status).toBe(message.status);
//         expect(component.showVideo).toBeTruthy();
//         expect(component.isAdminConsultation).toBeFalsy();
//     }));

//     it('should update non logged in participant status to in consultation', fakeAsync(() => {
//         const status = ParticipantStatus.InConsultation;
//         const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
//         const message = new ParticipantStatusMessage(participant.id, '', globalConference.id, status);
//         component.connected = true;
//         component.participant.status = ParticipantStatus.Available;
//         participantStatusSubject.next(message);
//         flushMicrotasks();

//         const postUpdateParticipant = component.hearing.getConference().participants.find(p => p.id === message.participantId);
//         expect(postUpdateParticipant.status).toBe(message.status);
//         expect(component.showVideo).toBeFalsy();
//     }));

//     it('should get conference when disconnected from eventhub less than 7 times', fakeAsync(() => {
//         spyOn(component, 'disconnect');
//         component.participant.status = ParticipantStatus.InHearing;
//         component.conference.status = ConferenceStatus.InSession;
//         component.participant.role = Role.None;

//         const newParticipantStatus = ParticipantStatus.InConsultation;
//         const newConferenceStatus = ConferenceStatus.Paused;
//         const newConference = new ConferenceResponse(Object.assign({}, globalConference));
//         newConference.status = newConferenceStatus;
//         newConference.participants.find(x => x.id === globalParticipant.id).status = newParticipantStatus;
//         component.loggedInUser = logged;

//         videoWebService.getConferenceById.and.resolveTo(newConference);

//         eventHubDisconnectSubject.next(1);
//         eventHubDisconnectSubject.next(2);
//         eventHubDisconnectSubject.next(3);
//         eventHubDisconnectSubject.next(4);
//         eventHubDisconnectSubject.next(5);
//         eventHubDisconnectSubject.next(6);

//         flushMicrotasks();
//         expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(6);
//         expect(component.participant.status).toBe(newParticipantStatus);
//         expect(component.conference.status).toBe(newConferenceStatus);
//         expect(component.conference).toEqual(newConference);
//     }));

//     it('does not disconnect judge from pexip before the first attempt to reconnect to event hub has been made', () => {
//         component.participant.role = Role.Judge;
//         spyOn(component, 'disconnect');

//         component.handleEventHubDisconnection(1);

//         expect(component.disconnect).not.toHaveBeenCalled();
//     });

//     it('should go to service error when disconnected from eventhub more than 7 times', () => {
//         eventHubDisconnectSubject.next(8);
//         expect(videoWebService.getConferenceById).toHaveBeenCalledTimes(0);
//     });

//     it('should update conference status and not show video when "in session" message received and participant is a witness', fakeAsync(() => {
//         component.participant = globalWitness;
//         const status = ConferenceStatus.InSession;
//         const message = new ConferenceStatusMessage(globalConference.id, status);
//         notificationSoundsService.playHearingAlertSound.calls.reset();

//         hearingStatusSubject.next(message);
//         tick();
//         flushMicrotasks();

//         expect(videoCallService.stopScreenShare).toHaveBeenCalledTimes(1);
//         expect(component.hearing.status).toBe(status);
//         expect(component.conference.status).toBe(status);
//         expect(component.showVideo).toBeFalsy();
//     }));

//     it('should ignore endpoint updates for another conference', fakeAsync(() => {
//         const status = EndpointStatus.Disconnected;
//         const message = new EndpointStatusMessage(globalEndpoint.id, Guid.create().toString(), status);

//         endpointStatusSubject.next(message);

//         const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
//         expect(endpoint.status === message.status).toBeFalsy();
//     }));

//     it('should ignore endpoint updates for not in conference', fakeAsync(() => {
//         const status = EndpointStatus.Disconnected;
//         const message = new EndpointStatusMessage(Guid.create().toString(), globalConference.id, status);

//         endpointStatusSubject.next(message);

//         const endpoints = component.hearing.getEndpoints().filter(x => x.status === status);
//         expect(endpoints.length).toBe(0);
//     }));

//     it('should update endpoint in conference', fakeAsync(() => {
//         const status = EndpointStatus.Disconnected;
//         const message = new EndpointStatusMessage(globalEndpoint.id, globalConference.id, status);

//         endpointStatusSubject.next(message);

//         const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
//         expect(endpoint.status === message.status).toBeTruthy();
//     }));

//     it('should set room to null on disconnect for endpoint in conference', fakeAsync(() => {
//         const status = EndpointStatus.Disconnected;
//         const message = new EndpointStatusMessage(globalEndpoint.id, globalConference.id, status);

//         endpointStatusSubject.next(message);

//         const endpoint = component.hearing.getEndpoints().find(x => x.id === message.endpointId);
//         expect(endpoint.current_room).toBeNull();
//     }));

//     describe('createOrUpdateWaitingOnLinkedParticipantsNotification', () => {
//         beforeEach(() => {
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
//         });

//         const expectedConsultationRoomLabel = 'ConsultationRoom';
//         const expectedInvitedByName = 'Invited By Name';
//         it('should raise a toast if there are linked participants who have NOT accepted their invitation', () => {
//             // Arrange
//             const invitation = {
//                 linkedParticipantStatuses: {},
//                 activeToast: null,
//                 answer: ConsultationAnswer.None,
//                 invitedByName: null
//             } as ConsultationInvitation;

//             invitation.invitedByName = expectedInvitedByName;
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

//             const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
//             findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

//             const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

//             component.participant.status = ParticipantStatus.InHearing;

//             // Act
//             component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

//             // Assert
//             expect(findParticipantSpy).toHaveBeenCalledTimes(2);
//             expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
//             expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
//             expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(
//                 expectedLinkedParticipantsWhoHaventAccepted,
//                 expectedInvitedByName,
//                 true
//             );
//             expect(invitation.activeToast).toBe(expectedToastSpy);
//         });

//         it('should close an existing toast before raising a new toast', () => {
//             // Arrange
//             const invitation = {
//                 linkedParticipantStatuses: {},
//                 activeToast: null,
//                 answer: ConsultationAnswer.None,
//                 invitedByName: null
//             } as ConsultationInvitation;

//             invitation.invitedByName = expectedInvitedByName;
//             const toastSpy = (invitation.activeToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']));
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

//             const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
//             findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

//             const expectedLinkedParticipantsWhoHaventAccepted = ['lp2', 'lp3'];

//             component.participant.status = ParticipantStatus.InHearing;

//             // Act
//             component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

//             // Assert
//             expect(findParticipantSpy).toHaveBeenCalledTimes(2);
//             expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[0]);
//             expect(findParticipantSpy).toHaveBeenCalledWith(expectedLinkedParticipantsWhoHaventAccepted[1]);
//             expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).toHaveBeenCalledOnceWith(
//                 expectedLinkedParticipantsWhoHaventAccepted,
//                 expectedInvitedByName,
//                 true
//             );
//             expect(invitation.activeToast).toBe(expectedToastSpy);
//             expect(toastSpy.remove).toHaveBeenCalledTimes(1);
//         });

//         it('should NOT raise a toast if there are NO linked participants who have NOT accepted their invitation', () => {
//             // Arrange
//             const invitation = {
//                 linkedParticipantStatuses: {},
//                 activeToast: null,
//                 answer: ConsultationAnswer.None,
//                 invitedByName: null
//             } as ConsultationInvitation;

//             invitation.invitedByName = expectedInvitedByName;
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

//             const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
//             findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

//             component.participant.status = ParticipantStatus.InHearing;

//             // Act
//             component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

//             // Assert
//             expect(findParticipantSpy).not.toHaveBeenCalled();
//             expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
//             expect(invitation.activeToast).toBeNull();
//         });

//         it('should NOT raise a toast if there are NO linked participants', () => {
//             // Arrange
//             const invitation = {
//                 linkedParticipantStatuses: {},
//                 activeToast: null,
//                 answer: ConsultationAnswer.None,
//                 invitedByName: null
//             } as ConsultationInvitation;

//             invitation.invitedByName = expectedInvitedByName;
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

//             const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
//             findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

//             component.participant.status = ParticipantStatus.InHearing;

//             // Act
//             component.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);

//             // Assert
//             expect(findParticipantSpy).not.toHaveBeenCalled();
//             expect(notificationToastrService.showWaitingForLinkedParticipantsToAccept).not.toHaveBeenCalled();
//             expect(invitation.activeToast).toBeNull();
//         });
//     });

//     describe('onConsultationAccepted', () => {
//         beforeEach(() => {
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
//             consultationInvitiationService.getInvitation.calls.reset();
//         });

//         const expectedConsultationRoomLabel = 'ConsultationRoom';
//         it('should call createOrUpdateWaitingOnLinkedParticipantsNotification and set the activeParticipantAccepted to true', () => {
//             // Arrange
//             const invitation = {
//                 linkedParticipantStatuses: {},
//                 activeToast: null,
//                 answer: ConsultationAnswer.None,
//                 invitedByName: null
//             } as ConsultationInvitation;

//             invitation.linkedParticipantStatuses = { lp1: true, lp2: false, lp3: false, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.and.returnValue(expectedToastSpy);

//             const findParticipantSpy = (component['findParticipant'] = jasmine.createSpy('findParticipant'));
//             findParticipantSpy.and.returnValues({ display_name: 'lp2' }, { display_name: 'lp3' });

//             spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');
//             component.participant.status = ParticipantStatus.InHearing;
//             component.displayDeviceChangeModal = true;

//             // Act
//             component.onConsultationAccepted(expectedConsultationRoomLabel);

//             // Assert
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledTimes(1);
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledWith(expectedConsultationRoomLabel);
//             expect(invitation.answer).toEqual(ConsultationAnswer.Accepted);
//             expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
//             expect(component.displayDeviceChangeModal).toBeFalse();
//         });
//     });

//     describe('onTransferingToConsultation', () => {
//         const expectedConsultationRoomLabel = 'ConsultationRoom';
//         it('should remove the active toast and delete the invitation from the consultation invitation service', () => {
//             // Arrange

//             // Act
//             component.onTransferingToConsultation(expectedConsultationRoomLabel);

//             // Assert
//             expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//         });
//     });

//     describe('onLinkedParticiantRejectedConsultationInvite', () => {
//         const linkedParticipant = participantsLinked[1];
//         const expectedConsultationRoomLabel = 'ConsultationRoom';
//         const expectedInvitedByName = 'invited by';
//         const expectedInvitationId = 'expected invitation id';
//         const toastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//         const invitation = {} as ConsultationInvitation;

//         beforeEach(() => {
//             notificationToastrService.showConsultationRejectedByLinkedParticipant.calls.reset();
//             consultationInvitiationService.getInvitation.calls.reset();
//             consultationInvitiationService.linkedParticipantRejectedInvitation.calls.reset();
//             toastSpy.remove.calls.reset();

//             toastSpy.declinedByThirdParty = false;
//             invitation.activeToast = toastSpy;
//             invitation.invitedByName = expectedInvitedByName;
//             invitation.invitationId = expectedInvitationId;
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);
//         });

//         it('should NOT make any calls and should return when the invitation does NOT have an invitation id', () => {
//             // Arrange
//             const expectedIsParticipantInHearing = true;
//             component.participant.status = ParticipantStatus.InHearing;
//             invitation.invitationId = null;

//             // Act
//             component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

//             // Assert
//             expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).not.toHaveBeenCalled();
//             expect(consultationInvitiationService.linkedParticipantRejectedInvitation).not.toHaveBeenCalled();
//             expect(toastSpy.remove).not.toHaveBeenCalled();
//             expect(toastSpy.declinedByThirdParty).toBeFalse();
//         });

//         it('should reject the invitation for a room and set the inital toast to rejectedByThirdParty to true if it exists when is in hearing', () => {
//             // Arrange
//             const expectedIsParticipantInHearing = true;
//             component.participant.status = ParticipantStatus.InHearing;

//             // Act
//             component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

//             // Assert
//             expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(
//                 globalConference.id,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.display_name,
//                 expectedInvitedByName,
//                 expectedIsParticipantInHearing
//             );
//             expect(consultationInvitiationService.linkedParticipantRejectedInvitation).toHaveBeenCalledOnceWith(
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id
//             );
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//             expect(toastSpy.remove).toHaveBeenCalledTimes(1);
//             expect(toastSpy.declinedByThirdParty).toBeTrue();
//         });

//         it('should reject the invitation for a room and set the inital toast to rejectedByThirdParty to true if it exists when is NOT in hearing', () => {
//             // Arrange
//             const expectedIsParticipantInHearing = false;
//             component.participant.status = ParticipantStatus.Available;

//             // Act
//             component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

//             // Assert
//             expect(notificationToastrService.showConsultationRejectedByLinkedParticipant).toHaveBeenCalledOnceWith(
//                 globalConference.id,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.display_name,
//                 expectedInvitedByName,
//                 expectedIsParticipantInHearing
//             );
//             expect(consultationInvitiationService.linkedParticipantRejectedInvitation).toHaveBeenCalledOnceWith(
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id
//             );
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//             expect(toastSpy.remove).toHaveBeenCalledTimes(1);
//             expect(toastSpy.declinedByThirdParty).toBeTrue();
//         });

//         it('should store the rejected toast on the invitation', () => {
//             // Arrange
//             component.participant.status = ParticipantStatus.Available;
//             const newToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
//             notificationToastrService.showConsultationRejectedByLinkedParticipant.and.returnValue(newToastSpy);

//             // Act
//             component.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, expectedConsultationRoomLabel);

//             // Assert
//             expect(toastSpy.remove).toHaveBeenCalledTimes(1);
//             expect(invitation.activeToast).toBe(newToastSpy);
//         });
//     });

//     describe('onLinkedParticiantAcceptedConsultationInvite', () => {
//         const primaryParticipant = participantsLinked[0];
//         const linkedParticipant = participantsLinked[1];
//         const expectedConsultationRoomLabel = 'ConsultationRoom';
//         const invitation = {} as ConsultationInvitation;

//         beforeEach(() => {
//             notificationToastrService.showWaitingForLinkedParticipantsToAccept.calls.reset();
//             consultationInvitiationService.getInvitation.calls.reset();

//             invitation.invitationId = 'invitation id';
//             invitation.answer = ConsultationAnswer.Accepted;
//         });

//         it('should NOT make any calls and should return when the invitation does NOT have an invitation id', () => {
//             // Arrange
//             invitation.invitationId = null;
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

//             // Act
//             component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

//             // Assert
//             expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeFalsy();
//             expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).not.toHaveBeenCalled();
//         });

//         it('should update the participant status and the toast notification for the invitation if there are still linked participants who havent accepted and the active participant has accepted', () => {
//             // Arrange
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

//             // Act
//             component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

//             // Assert
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//             expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeTrue();
//             expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).toHaveBeenCalledOnceWith(invitation);
//         });

//         it('should NOT update the toast notification for the invitation if the active participant has NOT accepted', () => {
//             // Arrange
//             invitation.linkedParticipantStatuses = { lp1: true, lp2: true, lp3: true, lp4: true };
//             invitation.answer = ConsultationAnswer.None;
//             consultationInvitiationService.getInvitation.and.returnValue(invitation);

//             spyOn(component, 'createOrUpdateWaitingOnLinkedParticipantsNotification');

//             // Act
//             component.onLinkedParticiantAcceptedConsultationInvite(expectedConsultationRoomLabel, linkedParticipant.id);

//             // Assert
//             expect(consultationInvitiationService.getInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//             expect(invitation.linkedParticipantStatuses[linkedParticipant.id]).toBeTrue();
//             expect(component.createOrUpdateWaitingOnLinkedParticipantsNotification).not.toHaveBeenCalled();
//         });
//     });

//     describe('onConsultationRejected', () => {
//         const expectedConsultationRoomLabel = 'ConsultationRoom';

//         beforeEach(() => {
//             consultationInvitiationService.removeInvitation.calls.reset();
//         });

//         it('should call removeInvitation for the room that was rejected', () => {
//             // Arrange

//             // Act
//             component.onConsultationRejected(expectedConsultationRoomLabel);

//             // Assert
//             expect(consultationInvitiationService.removeInvitation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//         });
//     });

//     describe('on recieve getConsultationRequestResponseMessage from the event hub', () => {
//         const primaryParticipant = participantsLinked[0];
//         const linkedParticipant = participantsLinked[1];
//         const expectedConsultationRoomLabel = 'ConsultationRoom';

//         it('should call onConsultationRejected when the active participant rejects the invitation', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 globalParticipant.id,
//                 ConsultationAnswer.Rejected,
//                 globalParticipant.id
//             );

//             spyOn(component, 'onConsultationRejected');
//             component.participant = globalParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onConsultationRejected).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//         }));

//         it('should NOT raise any toasts if the request was not raised directly by the linked participants client', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Rejected,
//                 globalParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onConsultationAccepted');
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onConsultationAccepted).not.toHaveBeenCalled();
//             expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
//         }));

//         it('should NOT raise any toasts if the participant is NOT linked and is NOT the current participant', fakeAsync(() => {
//             // Arrange
//             const responseInitiatorId = Guid.create().toString();
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 responseInitiatorId,
//                 ConsultationAnswer.Accepted,
//                 responseInitiatorId
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);

//             spyOn(component, 'onConsultationAccepted');
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onConsultationAccepted).not.toHaveBeenCalled();
//             expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
//         }));

//         it('should NOT raise any toasts if the linked participant accepted the consultation invite', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Accepted,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);

//             spyOn(component, 'onConsultationAccepted');
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onConsultationAccepted).not.toHaveBeenCalled();
//             expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
//         }));

//         it('should call onLinkedParticiantAcceptedConsultationInvite if a linked participant accepts the consultation invitation', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Accepted,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onLinkedParticiantAcceptedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantAcceptedConsultationInvite).toHaveBeenCalledOnceWith(
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id
//             );
//         }));

//         it('should raise a toast if a linked participant rejected the consultation request', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Rejected,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
//                 linkedParticipant,
//                 expectedConsultationRoomLabel
//             );
//         }));

//         it('should NOT raise a toast if a linked participant responed to the consultation request with transferring', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Transferring,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // TODO: Update with expected behaviour
//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
//         }));

//         it('should raise a toast if a linked participant responed to the consultation request with none', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.None,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
//                 linkedParticipant,
//                 expectedConsultationRoomLabel
//             );
//         }));

//         it('should raise a toast if a linked participants consultation request failed', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Failed,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');
//             component.participant = primaryParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
//                 linkedParticipant,
//                 expectedConsultationRoomLabel
//             );
//         }));

//         it('should call onLinkedParticiantRejectedConsultationInvite when a linked participant rejects the request', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Rejected,
//                 linkedParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             component.participant = primaryParticipant;

//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).toHaveBeenCalledOnceWith(
//                 linkedParticipant,
//                 expectedConsultationRoomLabel
//             );
//         }));

//         it('should NOT call onConsulationRejected when it was not sent by client who rejected the request', fakeAsync(() => {
//             // Arrange
//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 linkedParticipant.id,
//                 ConsultationAnswer.Rejected,
//                 globalParticipant.id
//             );

//             component['findParticipant'] = jasmine.createSpy('findParticipant').and.returnValue(linkedParticipant);
//             component.participant = primaryParticipant;

//             spyOn(component, 'onLinkedParticiantRejectedConsultationInvite');

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onLinkedParticiantRejectedConsultationInvite).not.toHaveBeenCalled();
//         }));

//         it('should call onTransferingToConsultation if a transfering message is recieved for the active participant', fakeAsync(() => {
//             // Arrange
//             spyOn(component, 'onTransferingToConsultation');

//             const message = new ConsultationRequestResponseMessage(
//                 globalConference.id,
//                 invitationId,
//                 expectedConsultationRoomLabel,
//                 globalParticipant.id,
//                 ConsultationAnswer.Transferring,
//                 globalParticipant.id
//             );

//             component.participant = globalParticipant;

//             // Act
//             consultationRequestResponseMessageSubject.next(message);
//             flush();

//             // Assert
//             expect(component.onTransferingToConsultation).toHaveBeenCalledOnceWith(expectedConsultationRoomLabel);
//         }));
//     });

//     describe('getParticipantsUpdated', () => {
//         const testConferenceId = 'TestConferenceId';
//         const testParticipant = new ParticipantResponse();
//         const testConference = new ConferenceResponse();
//         testConference.id = testConferenceId;
//         const testHearing = new Hearing(testConference);
//         testParticipant.id = 'TestId';
//         testParticipant.display_name = 'TestDisplayName';
//         testParticipant.linked_participants = [];
//         let getLoggedParticipantSpy: jasmine.Spy<() => ParticipantResponse>;

//         beforeEach(() => {
//             component.hearing = testHearing;
//             component.conference.participants = [];
//             getLoggedParticipantSpy = spyOn(component, 'getLoggedParticipant');
//         });

//         describe('when is not correct conference', () => {
//             const differentConferenceId = 'DifferentConferenceId';
//             const testParticipantMessage = new ParticipantsUpdatedMessage(differentConferenceId, [testParticipant]);
//             it('should not make any changes', () => {
//                 getParticipantsUpdatedSubjectMock.next(testParticipantMessage);
//                 expect(component.getLoggedParticipant).not.toHaveBeenCalled();
//                 expect(notificationToastrService.showParticipantAdded).not.toHaveBeenCalled();
//                 expect(component.conference.participants).toEqual([]);
//             });
//         });

//         describe('when is correct conference', () => {
//             let testParticipantMessage: ParticipantsUpdatedMessage;
//             beforeEach(() => {
//                 testParticipantMessage = new ParticipantsUpdatedMessage(testConferenceId, [testParticipant, component.participant]);
//             });

//             afterEach(() => {
//                 expect(component.getLoggedParticipant).toHaveBeenCalledTimes(1);
//             });

//             it('should show toast for in hearing', () => {
//                 // Arrange
//                 component.participant.status = ParticipantStatus.InHearing;

//                 // Act
//                 getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                 // Assert
//                 expect(notificationToastrService.showParticipantAdded).toHaveBeenCalledWith(testParticipant, true);
//                 assertParticipantsUpdated();
//             });

//             it('should show toast for in consultation', () => {
//                 // Arrange
//                 component.participant.status = ParticipantStatus.InConsultation;

//                 // Act
//                 getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                 // Assert
//                 expect(notificationToastrService.showParticipantAdded).toHaveBeenCalledWith(testParticipant, true);
//                 assertParticipantsUpdated();
//             });

//             it('should show toast for not in hearing or consultation', () => {
//                 // Arrange
//                 component.participant.status = ParticipantStatus.Available;

//                 // Act
//                 getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                 // Assert
//                 expect(notificationToastrService.showParticipantAdded).toHaveBeenCalledWith(testParticipant, false);
//                 assertParticipantsUpdated();
//             });

//             describe('when message participant already exists', () => {
//                 let existingParticipant: ParticipantResponse;
//                 beforeEach(() => {
//                     existingParticipant = new ParticipantResponse();
//                     existingParticipant.id = testParticipant.id;
//                     component.conference.participants = [existingParticipant];
//                 });

//                 it('should keep current room', () => {
//                     // Arrange
//                     const existingRoom = new RoomSummaryResponse();
//                     existingRoom.id = 'ExistingRoomId';
//                     existingRoom.label = 'ExistingRoomLabel';
//                     existingParticipant.current_room = existingRoom;

//                     // Act
//                     getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                     // Assert
//                     const updatedParticipant = component.conference.participants.find(x => x.id === testParticipant.id);
//                     expect(updatedParticipant.display_name).toBe(testParticipant.display_name);
//                     expect(updatedParticipant.current_room).toBe(existingRoom);
//                     assertParticipantsUpdated();
//                 });

//                 it('should keep current status', () => {
//                     // Arrange
//                     const existingStatus = ParticipantStatus.Joining;
//                     existingParticipant.status = existingStatus;

//                     // Act
//                     getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                     // Assert
//                     const updatedParticipant = component.conference.participants.find(x => x.id === testParticipant.id);
//                     expect(updatedParticipant.display_name).toBe(testParticipant.display_name);
//                     expect(updatedParticipant.status).toBe(existingStatus);
//                     assertParticipantsUpdated();
//                 });
//             });

//             describe('when participant is new', () => {
//                 it('should set current room to null if NOT already in in hearing', () => {
//                     // Arrange
//                     const sentRoom = new RoomSummaryResponse();
//                     sentRoom.id = 'SentRoomId';
//                     sentRoom.label = 'SentRoomLabel';
//                     testParticipant.current_room = sentRoom;

//                     // Act
//                     getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                     // Assert
//                     const updatedParticipant = component.conference.participants.find(x => x.id === testParticipant.id);
//                     expect(updatedParticipant.display_name).toBe(testParticipant.display_name);
//                     expect(updatedParticipant.current_room).toBeNull();
//                     assertParticipantsUpdated();
//                 });

//                 it('should set status to NotSignedIn if NOT already in in hearing', () => {
//                     // Arrange
//                     const sentStatus = ParticipantStatus.Available;
//                     testParticipant.id = 'Not available';
//                     testParticipant.status = sentStatus;
//                     // Act
//                     getParticipantsUpdatedSubjectMock.next(testParticipantMessage);

//                     // Assert
//                     const updatedParticipant = component.conference.participants.find(x => x.id === testParticipant.id);
//                     expect(updatedParticipant.display_name).toBe(testParticipant.display_name);
//                     expect(updatedParticipant.status).toBe(ParticipantStatus.NotSignedIn);
//                     assertParticipantsUpdated();
//                 });
//             });

//             function assertParticipantsUpdated() {
//                 const participants = component.hearing.getConference().participants;
//                 expect(participants).not.toBeUndefined();
//                 expect(participants.length).toBe(testParticipantMessage.participants.length);
//                 expect(participants).toEqual(jasmine.arrayContaining(testParticipantMessage.participants));
//             }
//         });
//     });

//     describe('getEndpointsUpdated', () => {
//         const testConferenceId = 'TestConferenceId';

//         const testExistingVideoEndpointResponse = new VideoEndpointResponse();
//         testExistingVideoEndpointResponse.id = 'TestUpdateId';
//         testExistingVideoEndpointResponse.display_name = 'TestExistingDisplayName';

//         // To Test the Add functionality
//         const testAddVideoEndpointResponse = new VideoEndpointResponse();
//         testAddVideoEndpointResponse.id = 'TestAddId';
//         testAddVideoEndpointResponse.display_name = 'TestAddDisplayName';

//         const testUpdateEndpointsDtoAdd = new UpdateEndpointsDto();
//         testUpdateEndpointsDtoAdd.existing_endpoints = [];
//         testUpdateEndpointsDtoAdd.new_endpoints = [testAddVideoEndpointResponse];
//         testUpdateEndpointsDtoAdd.removed_endpoints = [];

//         // To Test the Update functionality
//         const testUpdateVideoEndpointResponse = new VideoEndpointResponse();
//         testUpdateVideoEndpointResponse.id = 'TestUpdateId';
//         testUpdateVideoEndpointResponse.display_name = 'TestUpdateDisplayName';

//         const testUpdateEndpointsDtoUpdate = new UpdateEndpointsDto();
//         testUpdateEndpointsDtoUpdate.existing_endpoints = [testUpdateVideoEndpointResponse];
//         testUpdateEndpointsDtoUpdate.new_endpoints = [];
//         testUpdateEndpointsDtoUpdate.removed_endpoints = [];

//         const testConference = new ConferenceResponse(Object.assign({}, globalConference));
//         testConference.id = testConferenceId;
//         const testHearing = new Hearing(testConference);

//         beforeEach(() => {
//             component.hearing = testHearing;
//             component.conference.endpoints = [testExistingVideoEndpointResponse];
//         });

//         describe('when is not correct conference', () => {
//             const differentConferenceId = 'DifferentConferenceId';
//             const testEndpointUpdatedMessage = new EndpointsUpdatedMessage(differentConferenceId, testUpdateEndpointsDtoAdd);

//             it('should not make any changes', () => {
//                 getEndpointsUpdatedMessageSubjectMock.next(testEndpointUpdatedMessage);
//                 expect(notificationToastrService.showEndpointAdded).not.toHaveBeenCalled();
//                 expect(notificationToastrService.showEndpointUpdated).not.toHaveBeenCalled();
//                 expect(component.conference.endpoints).toEqual([testExistingVideoEndpointResponse]);
//             });
//         });

//         describe('when is correct conference', () => {
//             let testEndpointMessageAdd: EndpointsUpdatedMessage;
//             let testEndpointMessageUpdate: EndpointsUpdatedMessage;
//             let existingEndpoint: VideoEndpointResponse;
//             let getConferenceSpy: jasmine.Spy;

//             beforeEach(() => {
//                 notificationToastrService.showEndpointAdded.calls.reset();
//                 existingEndpoint = testExistingVideoEndpointResponse;
//                 component.conference.endpoints = [existingEndpoint];
//                 component.hearing = new Hearing(component.conference);
//                 testEndpointMessageAdd = new EndpointsUpdatedMessage(component.conference.id, testUpdateEndpointsDtoAdd);
//                 testEndpointMessageUpdate = new EndpointsUpdatedMessage(component.conference.id, testUpdateEndpointsDtoUpdate);
//                 getConferenceSpy = spyOn(component, 'getConference');
//             });

//             it('should update existing endpoint', fakeAsync(() => {
//                 // Arrange
//                 component.participant.status = ParticipantStatus.Available;

//                 // Act
//                 getEndpointsUpdatedMessageSubjectMock.next(testEndpointMessageUpdate);
//                 tick();

//                 // Assert
//                 const updatedEndpoint = component.conference.endpoints.find(x => x.id === testUpdateVideoEndpointResponse.id);
//                 expect(component.conference.endpoints.length).toEqual(1);
//                 expect(updatedEndpoint.display_name).toBe(testUpdateVideoEndpointResponse.display_name);
//             }));
//         });
//     });

//     describe('getHearingLayoutChanged', () => {
//         const testConferenceId = 'TestConferenceId';
//         const testConference = new ConferenceResponse();
//         testConference.id = testConferenceId;
//         const testHearing = new Hearing(testConference);
//         const testParticipant = new ParticipantResponse();
//         testParticipant.id = 'p1Id';
//         testParticipant.status = ParticipantStatus.InHearing;

//         const testParticipantAlert = new ParticipantResponse();
//         testParticipantAlert.id = 'p1Id';
//         testParticipantAlert.status = ParticipantStatus.InHearing;
//         const differentConferenceId = 'DifferentConferenceId';

//         const participant = globalConference.participants.filter(x => x.id !== globalParticipant.id)[0];
//         let testHearingLayoutMessage;
//         let findParticipantSpy;
//         let getLoggedParticipantSpy;
//         let isHostSpy;

//         beforeEach(() => {
//             component.hearing = testHearing;
//             component.conference.participants = [];
//             component.participant = participant;
//             testHearingLayoutMessage = new HearingLayoutChanged(
//                 testConferenceId,
//                 testParticipant.id,
//                 HearingLayout.Dynamic,
//                 HearingLayout.OnePlus7
//             );
//             isHostSpy = spyOn(component, 'isHost');
//             isHostSpy.and.returnValue(true);
//             getLoggedParticipantSpy = component['getLoggedParticipant'] = jasmine.createSpy('getLoggedParticipant');
//             getLoggedParticipantSpy.and.returnValue({ id: 'p2Id' });

//             findParticipantSpy = component['findParticipant'] = jasmine.createSpy('findParticipant');
//         });

//         describe('contact details object', () => {
//             it('should return phone number', () => {
//                 component.phoneNumber$.subscribe(value => {
//                     expect(value).toEqual(vhContactDetails.englandAndWales.phoneNumber);
//                 });
//             });
//         });
//     });

//     describe('getHearingDetailsUpdated', () => {
//         it('should update the conference', () => {
//             // Arrange
//             const newScheduledDateTime = new Date(globalConference.scheduled_date_time);
//             newScheduledDateTime.setHours(newScheduledDateTime.getHours() + 2);
//             const updatedConference = new ConferenceResponse({
//                 id: globalConference.id,
//                 scheduled_date_time: newScheduledDateTime,
//                 audio_recording_required: !globalConference.audio_recording_required
//             });
//             updatedConference.audio_recording_required = !updatedConference.audio_recording_required;

//             const hearingDetailsUpdatedMessage = new HearingDetailsUpdatedMessage(updatedConference);

//             // Act
//             getHearingDetailsUpdatedMock.next(hearingDetailsUpdatedMessage);

//             // Assert
//             expect(component.conference.id).toBe(updatedConference.id);
//             expect(component.conference.scheduled_date_time).toBe(updatedConference.scheduled_date_time);
//             expect(component.conference.audio_recording_required).toBe(updatedConference.audio_recording_required);
//         });
//     });

//     describe('conference store - get phone number', () => {
//         it('should set welsh flag to true when conference is welsh', fakeAsync(() => {
//             const conference = new ConferenceResponse(Object.assign({}, globalConference));
//             conference.hearing_venue_is_scottish = false;
//             const vhConference = mapConferenceToVHConference(conference);
//             vhConference.countdownComplete = true;
//             mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
//             mockConferenceStore.overrideSelector(ConferenceSelectors.getAvailableRooms, []);

//             const result$ = component.phoneNumber$;

//             expect(result$).toBeObservable(cold('(a|)', { a: vhContactDetails.englandAndWales.phoneNumber }));
//         }));

//         describe('when conference is scottish', () => {
//             beforeEach(() => {
//                 const conference = new ConferenceResponse(Object.assign({}, globalConference));
//                 conference.hearing_venue_is_scottish = true;
//                 const vhConference = mapConferenceToVHConference(conference);
//                 mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

//                 fixture = TestBed.createComponent(WRTestComponent);
//                 component = fixture.componentInstance;
//             });

//             afterEach(() => {
//                 component.eventHubSubscription$.unsubscribe();
//                 if (component.callbackTimeout) {
//                     clearTimeout(component.callbackTimeout);
//                 }
//                 mockConferenceStore.resetSelectors();
//             });

//             it('should set welsh flag to false when conference is scottish', fakeAsync(() => {
//                 const result$ = component.phoneNumber$;

//                 expect(result$).toBeObservable(cold('(a|)', { a: vhContactDetails.scotland.phoneNumber }));
//             }));
//         });
//     });
// });
