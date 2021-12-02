import { ElementRef } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ActiveToast } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import {
    ConferenceResponse,
    ConferenceStatus,
    LinkedParticipantResponse,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    SharedParticipantRoom
} from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { HearingRole } from '../../models/hearing-role-model';
import {
    activatedRoute,
    clockService,
    consultationInvitiationService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    mockedHearingVenueFlagsService,
    notificationSoundsService,
    notificationToastrService,
    roomClosingToastrService,
    router,
    videoCallService,
    videoWebService
} from './waiting-room-base-setup';
import { WRTestComponent } from './WRTestComponent';
import { createParticipantRemoteMuteStoreServiceSpy } from '../../services/mock-participant-remote-mute-store.service';

describe('WaitingRoomComponent message and clock', () => {
    let component: WRTestComponent;

    beforeAll(() => {
        initAllWRDependencies();

        const mockToast = {
            toastRef: {
                componentInstance: {}
            }
        } as ActiveToast<RoomClosingToastComponent>;
        roomClosingToastrService.showRoomClosingAlert.and.callFake((hearing, date) => {
            roomClosingToastrService.currentToast = mockToast;
        });
        roomClosingToastrService.clearToasts.and.callFake(() => {
            roomClosingToastrService.currentToast = null;
        });
    });

    let participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

    beforeEach(() => {
        participantRemoteMuteStoreServiceSpy = createParticipantRemoteMuteStoreServiceSpy();
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
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            participantRemoteMuteStoreServiceSpy,
            mockedHearingVenueFlagsService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        videoWebService.getConferenceById.calls.reset();
    });

    describe('toggle Panel', () => {
        const participantPanelName = 'Participants';
        const chatPanelName = 'Chat';

        it('should switch Participants from false to true  when starting from false', () => {
            // Arrange
            component.panelStates[chatPanelName] = false;
            component.panelStates[participantPanelName] = false;

            // Act & Assert
            component.togglePanel(participantPanelName);
            expect(component.panelStates.Participants).toBe(true);
            expect(component.panelStates.Chat).toBe(false);
        });

        it('should switch Participants from true to false when starting from true', () => {
            // Arrange
            component.panelStates[chatPanelName] = false;
            component.panelStates[participantPanelName] = true;

            // Act & Assert
            component.togglePanel(participantPanelName);
            expect(component.panelStates.Participants).toBe(false);
            expect(component.panelStates.Chat).toBe(false);
        });

        it('should switch Participants from false to true when starting from false and already a chat panel is open', () => {
            // Arrange
            component.panelStates[chatPanelName] = true;
            component.panelStates[participantPanelName] = false;

            // Act & Assert
            component.togglePanel(participantPanelName);
            expect(component.panelStates.Participants).toBe(true);
            expect(component.panelStates.Chat).toBe(false);
        });

        it('should switch chat from false to true  when starting from false', () => {
            // Arrange
            component.panelStates[chatPanelName] = false;
            component.panelStates[participantPanelName] = false;

            // Act & Assert
            component.togglePanel(chatPanelName);
            expect(component.panelStates.Chat).toBe(true);
            expect(component.panelStates.Participants).toBe(false);
        });

        it('should switch chat from true to false when starting from true', () => {
            // Arrange
            component.panelStates[chatPanelName] = true;
            component.panelStates[participantPanelName] = false;

            // Act & Assert
            component.togglePanel(chatPanelName);
            expect(component.panelStates.Chat).toBe(false);
            expect(component.panelStates.Participants).toBe(false);
        });

        it('should switch chat from false to true when starting from false when a participant panel is open', () => {
            // Arrange
            component.panelStates[chatPanelName] = false;
            component.panelStates[participantPanelName] = true;
            // Act & Assert
            component.togglePanel(chatPanelName);
            expect(component.panelStates.Chat).toBe(true);
            expect(component.panelStates.Participants).toBe(false);
        });
    });

    it('should call consultation service to close all modals', () => {
        // Act
        component.closeAllPCModals();

        // Assert
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });

    it('should call consultation service to show leave consultation modal', () => {
        // Act
        component.showLeaveConsultationModal();

        // Assert
        expect(consultationService.displayConsultationLeaveModal).toHaveBeenCalledTimes(1);
    });

    it('should get conference', fakeAsync(async () => {
        // Arrange
        component.hearing = undefined;
        component.conference = undefined;
        component.participant = undefined;
        component.connected = false;

        videoWebService.getConferenceById.and.resolveTo(globalConference);
        videoWebService.getAllowedEndpointsForConference.and.resolveTo([]);
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: globalConference.participants[0].id,
            display_name: globalConference.participants[0].display_name,
            role: globalConference.participants[0].role
        });

        // Act
        await component.getConference();

        // Assert
        expect(videoWebService.getAllowedEndpointsForConference).toHaveBeenCalledTimes(1);
        expect(component.loadingData).toBeFalsy();
        expect(component.hearing).toBeDefined();
        expect(component.participant).toBeDefined();
    }));

    it('getConference sets HearingVenueIsScottish property to true when hearing venue is in scotland', fakeAsync(async () => {
        // Arrange
        component.hearing = undefined;
        component.conference = undefined;
        component.participant = undefined;
        component.connected = false;
        globalConference.hearing_venue_is_scottish = true;
        videoWebService.getConferenceById.and.resolveTo(globalConference);
        videoWebService.getAllowedEndpointsForConference.and.resolveTo([]);

        // Act
        await component.getConference();

        // Assert
        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(true);
    }));

    it('getConference sets HearingVenueIsScottish property to false when hearing venue is not in scotland', fakeAsync(async () => {
        // Arrange
        component.hearing = undefined;
        component.conference = undefined;
        component.participant = undefined;
        component.connected = false;
        globalConference.hearing_venue_is_scottish = false;
        videoWebService.getConferenceById.and.resolveTo(globalConference);
        videoWebService.getAllowedEndpointsForConference.and.resolveTo([]);

        // Act
        await component.getConference();

        // Assert
        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(false);
    }));

    it('should handle api error with error service when get conference fails', async () => {
        component.hearing = undefined;
        component.conference = undefined;
        component.participant = undefined;
        component.connected = false;

        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);
        await component.getConference();
        expect(component.loadingData).toBeFalsy();
        expect(component.hearing).toBeUndefined();
        expect(component.participant).toBeUndefined();
        expect(errorService.handleApiError).toHaveBeenCalled();
    });

    it('should update the participant', async () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.hearing.getConference().closed_date_time = null;
        const closedConference = new ConferenceResponse(Object.assign({}, globalConference));
        closedConference.status = ConferenceStatus.Closed;
        closedConference.closed_date_time = new Date();

        const originalParticipant = (component.participant = globalConference.participants[0]);
        const expectedParticipant = new ParticipantResponse(globalConference.participants[0].toJSON());

        spyOn(component, 'getLoggedParticipant').and.returnValue(expectedParticipant);

        videoWebService.getConferenceById.and.resolveTo(closedConference);
        await component.getConferenceClosedTime(component.conference.id);

        expect(component.hearing).toBeDefined();
        expect(component.hearing.isClosed()).toBeTruthy();
        expect(component.hearing.getConference().closed_date_time).toBeDefined();
        expect(component.participant).toBeDefined();
        expect(component.participant).toBe(expectedParticipant);
        expect(originalParticipant.id).toBe(component.participant.id);
    });

    it('getConferenceClosedTime sets HearingVenueIsScottish property to true when hearing venue is in scotland', async () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.hearing.getConference().closed_date_time = null;
        const closedConference = new ConferenceResponse(Object.assign({}, globalConference));
        closedConference.status = ConferenceStatus.Closed;
        closedConference.closed_date_time = new Date();
        closedConference.hearing_venue_is_scottish = true;
        const expectedParticipant = new ParticipantResponse(globalConference.participants[0].toJSON());

        spyOn(component, 'getLoggedParticipant').and.returnValue(expectedParticipant);

        videoWebService.getConferenceById.and.resolveTo(closedConference);

        await component.getConferenceClosedTime(component.conference.id);

        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(true);
    });

    it('getConferenceClosedTime sets HearingVenueIsScottish property to false when hearing venue is not in scotland', async () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.hearing.getConference().closed_date_time = null;
        const closedConference = new ConferenceResponse(Object.assign({}, globalConference));
        closedConference.status = ConferenceStatus.Closed;
        closedConference.closed_date_time = new Date();
        closedConference.hearing_venue_is_scottish = false;
        const expectedParticipant = new ParticipantResponse(globalConference.participants[0].toJSON());

        spyOn(component, 'getLoggedParticipant').and.returnValue(expectedParticipant);

        videoWebService.getConferenceById.and.resolveTo(closedConference);

        await component.getConferenceClosedTime(component.conference.id);

        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(false);
    });

    it('should get the conference for closed time', async () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.hearing.getConference().closed_date_time = null;
        const closedConference = new ConferenceResponse(Object.assign({}, globalConference));
        closedConference.status = ConferenceStatus.Closed;
        closedConference.closed_date_time = new Date();

        videoWebService.getConferenceById.and.resolveTo(closedConference);
        await component.getConferenceClosedTime(component.conference.id);
        expect(component.hearing).toBeDefined();
        expect(component.hearing.isClosed()).toBeTruthy();
        expect(component.hearing.getConference().closed_date_time).toBeDefined();
        expect(component.participant).toBeDefined();
    });

    it('should log error when unable to capture conference end time', async () => {
        component.hearing.getConference().status = ConferenceStatus.InSession;
        component.hearing.getConference().closed_date_time = undefined;
        const error = { status: 401, isApiException: true };
        videoWebService.getConferenceById.and.rejectWith(error);
        logger.error.calls.reset();

        await component.getConferenceClosedTime(component.conference.id);

        expect(component.hearing.isClosed()).toBeFalsy();
        expect(component.hearing.getConference().closed_date_time).toBeUndefined();
        expect(logger.error).toHaveBeenCalled();
    });

    it('should set displayDeviceChangeModal to true on showChooseCameraDialog', () => {
        component.displayDeviceChangeModal = false;
        component.showChooseCameraDialog();
        expect(component.displayDeviceChangeModal).toBeTruthy();
    });

    it('should set displayDeviceChangeModal to false onSelectMediaDeviceShouldClose', () => {
        component.displayDeviceChangeModal = true;
        component.onSelectMediaDeviceShouldClose();
        expect(component.displayDeviceChangeModal).toBeFalsy();
    });

    it('should clean up timeouts and subscriptions', () => {
        component.eventHubSubscription$ = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component.videoCallSubscription$ = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component.clockSubscription$ = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        const timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component.callbackTimeout = timer;
        spyOn(global, 'clearTimeout');

        component.executeWaitingRoomCleanup();

        expect(component.eventHubSubscription$.unsubscribe).toHaveBeenCalled();
        expect(component.videoCallSubscription$.unsubscribe).toHaveBeenCalled();
        expect(component.clockSubscription$.unsubscribe).toHaveBeenCalled();
        expect(clearTimeout).toHaveBeenCalled();
    });

    const showExtraContentTestCases = [
        { isTransferringIn: false, showVideo: false, expected: true },
        { isTransferringIn: false, showVideo: true, expected: false },
        { isTransferringIn: true, showVideo: false, expected: false },
        { isTransferringIn: true, showVideo: true, expected: false }
    ];

    showExtraContentTestCases.forEach(testCase => {
        it(`should ${!testCase.expected ? 'not' : ''} showExtraContent when transferring in is ${
            testCase.isTransferringIn
        } and show video is ${testCase.showVideo}`, () => {
            component.isTransferringIn = testCase.isTransferringIn;
            component.showVideo = testCase.showVideo;

            expect(component.showExtraContent).toBe(testCase.expected);
        });
    });

    it('should raise leave consultation request on cancel consultation request', async () => {
        await component.onConsultationCancelled();
        expect(consultationService.leaveConsultation).toHaveBeenCalledWith(component.conference, component.participant);
    });

    it('should log error when cancelling consultation returns an error', async () => {
        const error = { status: 401, isApiException: true };
        consultationService.leaveConsultation.and.rejectWith(error);
        await component.onConsultationCancelled();
        expect(logger.error.calls.mostRecent().args[0]).toContain('Failed to leave private consultation');
    });

    const isSupportedBrowserForNetworkHealthTestCases = [
        { isSupportedBrowser: true, browserName: 'Chrome', expected: true },
        { isSupportedBrowser: false, browserName: 'Opera', expected: false },
        { isSupportedBrowser: true, browserName: 'Safari', expected: true },
        { isSupportedBrowser: true, browserName: 'MS-Edge', expected: false }
    ];

    isSupportedBrowserForNetworkHealthTestCases.forEach(testcase => {
        it(`should return ${testcase.expected} when browser is ${testcase.browserName}`, () => {
            deviceTypeService.isSupportedBrowser.and.returnValue(testcase.isSupportedBrowser);
            deviceTypeService.getBrowserName.and.returnValue(testcase.browserName);
            expect(component.isSupportedBrowserForNetworkHealth).toBe(testcase.expected);
        });
    });

    it('should return the total number of judge and JOHs in consultation', () => {
        component.conference.participants.forEach(x => (x.status = ParticipantStatus.InConsultation));
        const expectecCount = component.conference.participants.filter(
            x =>
                (x.role === Role.JudicialOfficeHolder || x.role === Role.Judge) &&
                x.current_room?.label.toLowerCase().includes('judgejohconsultationroom')
        ).length;

        expect(component.numberOfJudgeOrJOHsInConsultation).toBe(expectecCount);
    });

    it('should request to join judicial consultation room', async () => {
        await component.joinJudicialConsultation();
        expect(consultationService.joinJudicialConsultationRoom).toHaveBeenCalledWith(component.conference, component.participant);
    });

    it('should request to leave judicial consultation room', async () => {
        consultationService.leaveConsultation.calls.reset();
        consultationService.leaveConsultation.and.returnValue(Promise.resolve());
        await component.leaveJudicialConsultation();
        expect(consultationService.leaveConsultation).toHaveBeenCalled();
    });

    it('should hide change device popup on close popup', () => {
        component.displayDeviceChangeModal = true;
        component.onSelectMediaDeviceShouldClose();
        expect(component.displayDeviceChangeModal).toBe(false);
    });

    it('should not announce hearing is starting when already announced', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearingStartingAnnounced = true;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should not announce hearing ready to start when hearing is not near start time', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearing = new Hearing(new ConferenceTestData().getConferenceDetailFuture());
        component.hearingStartingAnnounced = false;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    });

    it('should announce hearing ready to start and not already announced', () => {
        spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => Promise.resolve());
        component.hearing = new Hearing(new ConferenceTestData().getConferenceDetailNow());
        component.hearingStartingAnnounced = false;
        component.checkIfHearingIsStarting();
        expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(1);
    });

    it('should set hearing announced to true when hearing sound has played', async () => {
        notificationSoundsService.playHearingAlertSound.calls.reset();
        await component.announceHearingIsAboutToStart();
        expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
        expect(component.hearingStartingAnnounced).toBeTruthy();
    });

    it('should clear subscription and go to hearing list when conference is past closed time', () => {
        const conf = new ConferenceTestData().getConferenceDetailNow();
        const status = ConferenceStatus.Closed;
        const closedDateTime = new Date(new Date().toUTCString());
        closedDateTime.setUTCMinutes(closedDateTime.getUTCMinutes() - 120);
        conf.status = status;
        conf.closed_date_time = closedDateTime;
        component.hearing = new Hearing(conf);
        component.clockSubscription$ = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);

        component.checkIfHearingIsClosed();

        expect(component.clockSubscription$.unsubscribe).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });
    it('should return string with case name and number', () => {
        const caseName = component.conference.case_name;
        const caseNumber = component.conference.case_number;
        const result = component.getCaseNameAndNumber();
        expect(result.indexOf(caseName)).toBeGreaterThan(-1);
        expect(result.indexOf(caseNumber)).toBeGreaterThan(-1);
    });

    it('showRoomClosingToast() should clear all toasts when not in the consultation room', async () => {
        component.isPrivateConsultation = false;
        const date = new Date();

        await component.showRoomClosingToast(date);

        expect(roomClosingToastrService.clearToasts).toHaveBeenCalled();
        expect(roomClosingToastrService.currentToast).toBeFalsy();
    });

    it('showRoomClosingToast() should show "room closing" toast when in the consultation room', async () => {
        component.isPrivateConsultation = true;
        const date = new Date();

        await component.showRoomClosingToast(date);

        expect(roomClosingToastrService.showRoomClosingAlert).toHaveBeenCalledWith(component.hearing, date);
        expect(roomClosingToastrService.currentToast).toBeTruthy();
    });

    describe('call', () => {
        beforeAll(() => {
            jasmine.getEnv().allowRespy(true);
        });
        afterAll(() => {
            jasmine.getEnv().allowRespy(false);
        });

        describe('failing scenarios', () => {
            beforeEach(() => {
                videoCallService.makeCall.calls.reset();
                spyOnProperty(eventsServiceSpy, 'eventHubIsConnected').and.returnValue(false);
            });

            it('should not call when event hub is not connected', () => {
                // Setup handled in beforeEach. Left blank intentionally.
            });

            afterEach(async () => {
                await component.call();
                expect(videoCallService.makeCall).not.toHaveBeenCalled();
            });
        });

        describe('when eventHubIsConnected and token is set', () => {
            beforeEach(() => {
                spyOnProperty(eventsServiceSpy, 'eventHubIsConnected').and.returnValue(true);
            });
            it('should use interpreter room when participant has links', async () => {
                component.participant.linked_participants = [
                    new LinkedParticipantResponse({ linked_id: Guid.create().toString(), link_type: LinkType.Interpreter })
                ];
                const room = new SharedParticipantRoom({
                    participant_join_uri: 'patjoinuri',
                    pexip_node: 'sip.test.node',
                    display_name: 'foo',
                    tile_display_name: `I1;Interpreter1;${component.participant.id}`
                });
                videoCallService.retrieveInterpreterRoom.and.resolveTo(room);

                await component.call();

                expect(videoCallService.makeCall).toHaveBeenCalledWith(
                    room.pexip_node,
                    room.participant_join_uri,
                    room.tile_display_name,
                    component.maxBandwidth
                );
            });

            it('should use witness interpreter room when participant or links is a witness', async () => {
                const witness = component.conference.participants.find(x => x.hearing_role === HearingRole.WITNESS);
                witness.linked_participants = [
                    new LinkedParticipantResponse({ linked_id: component.participant.id, link_type: LinkType.Interpreter })
                ];
                component.participant.linked_participants = [
                    new LinkedParticipantResponse({ linked_id: witness.id, link_type: LinkType.Interpreter })
                ];
                const room = new SharedParticipantRoom({
                    participant_join_uri: 'patjoinuri',
                    pexip_node: 'sip.test.node',
                    display_name: 'foo',
                    tile_display_name: `I1;Interpreter1;${component.participant.id}`
                });
                videoCallService.retrieveWitnessInterpreterRoom.and.resolveTo(room);

                await component.call();

                expect(videoCallService.makeCall).toHaveBeenCalledWith(
                    room.pexip_node,
                    room.participant_join_uri,
                    room.tile_display_name,
                    component.maxBandwidth
                );
            });

            it('should use judicial room when participant is a joh', async () => {
                component.participant.role = Role.JudicialOfficeHolder;
                const room = new SharedParticipantRoom({
                    participant_join_uri: 'patjoinuri',
                    pexip_node: 'sip.test.node',
                    display_name: 'foo',
                    tile_display_name: `T1;PanelMember;${component.participant.id}`
                });
                videoCallService.retrieveJudicialRoom.and.resolveTo(room);

                await component.call();

                expect(videoCallService.makeCall).toHaveBeenCalledWith(
                    room.pexip_node,
                    room.participant_join_uri,
                    room.tile_display_name,
                    component.maxBandwidth
                );
            });
        });
    });

    it('should mute video stream when participant is not in hearing', () => {
        component.countdownComplete = false;
        component.participant.status = ParticipantStatus.Available;
        spyOnProperty(component.hearing, 'status', 'get').and.returnValue(ConferenceStatus.Suspended);

        expect(component.shouldMuteHearing()).toBe(true);
    });

    it('should mute video stream when participant is in hearing but the hearing status is not in session', () => {
        component.countdownComplete = false;
        component.participant.status = ParticipantStatus.InHearing;
        spyOnProperty(component.hearing, 'status', 'get').and.returnValue(ConferenceStatus.Suspended);

        expect(component.shouldMuteHearing()).toBe(true);
    });

    it('should mute video stream when participant is not in hearing', () => {
        component.countdownComplete = false;
        component.participant.status = ParticipantStatus.Available;
        spyOnProperty(component.hearing, 'status', 'get').and.returnValue(ConferenceStatus.Suspended);

        expect(component.shouldMuteHearing()).toBe(true);
    });

    it('should mute video stream when participant is in hearing and countdown is not complete', () => {
        component.countdownComplete = false;
        component.participant.status = ParticipantStatus.InHearing;
        spyOnProperty(component.hearing, 'status', 'get').and.returnValue(ConferenceStatus.InSession);

        expect(component.shouldMuteHearing()).toBe(true);
    });

    it('should not mute video stream when participant is in hearing and countdown is complete', () => {
        component.countdownComplete = true;
        component.participant.status = ParticipantStatus.InHearing;
        spyOnProperty(component.hearing, 'status', 'get').and.returnValue(ConferenceStatus.InSession);

        expect(component.shouldMuteHearing()).toBe(false);
    });

    it('should return false if case name has not been truncated', () => {
        const caseNameElement = document.createElement('div');
        caseNameElement.innerHTML = component.getCaseNameAndNumber();

        const elemRef = new ElementRef(caseNameElement);
        component.roomTitleLabel = elemRef;

        expect(component.hasCaseNameOverflowed).toBeFalsy();
    });

    it('should return true if case name has been truncated', () => {
        const caseNameElement = document.createElement('div');
        const caseName = component.getCaseNameAndNumber();
        caseNameElement.innerHTML = caseName;
        spyOnProperty(caseNameElement, 'scrollWidth').and.returnValue(caseName.length + 1);
        const elemRef = new ElementRef(caseNameElement);
        component.roomTitleLabel = elemRef;

        expect(component.hasCaseNameOverflowed).toBeTruthy();
    });

    it('should return true if case name has been truncated', () => {
        component.roomTitleLabel = null;
        expect(component.hasCaseNameOverflowed).toBeFalsy();
    });

    describe('isParticipantInCorrectWaitingRoomState', () => {
        it('should return true when the participant is connected, available and in the waiting room', () => {
            // Arrange
            component.connected = true;
            component.participant.status = ParticipantStatus.Available;
            component.participant.current_room = new RoomSummaryResponse();
            component.participant.current_room.label = 'WaitingRoom';

            // Act
            const result = component.isParticipantInCorrectWaitingRoomState();

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false when the participant is NOT connected but is available and in the waiting room', () => {
            // Arrange
            component.connected = false;
            component.participant.status = ParticipantStatus.Available;
            component.participant.current_room = new RoomSummaryResponse();
            component.participant.current_room.label = 'WaitingRoom';

            // Act
            const result = component.isParticipantInCorrectWaitingRoomState();

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false when the participant is connected and is available but is NOT in the waiting room', () => {
            // Arrange
            component.connected = true;
            component.participant.status = ParticipantStatus.Available;
            component.participant.current_room = new RoomSummaryResponse();
            component.participant.current_room.label = 'HearingRoom';

            // Act
            const result = component.isParticipantInCorrectWaitingRoomState();

            // Assert
            expect(result).toBeFalse();
        });

        it('should return true when the participant is connected and is available but the current room is null', () => {
            // Arrange
            component.connected = true;
            component.participant.status = ParticipantStatus.Available;
            component.participant.current_room = null;

            // Act
            const result = component.isParticipantInCorrectWaitingRoomState();

            // Assert
            expect(result).toBeTrue();
        });

        const testCases = [
            { key: 'Disconnected', value: ParticipantStatus.Disconnected },
            { key: 'In Consultation', value: ParticipantStatus.InConsultation },
            { key: 'In Hearing', value: ParticipantStatus.InHearing },
            { key: 'Joining', value: ParticipantStatus.Joining },
            { key: 'None', value: ParticipantStatus.None },
            { key: 'Not Signed In', value: ParticipantStatus.NotSignedIn },
            { key: 'Unable To Join', value: ParticipantStatus.UnableToJoin }
        ];

        testCases.forEach(testCase => {
            it(`should return true when the participant is connected and the room is valid but the status is ${testCase.key}`, () => {
                // Arrange
                component.connected = true;
                component.participant.status = ParticipantStatus.Available;
                component.participant.current_room = null;

                // Act
                const result = component.isParticipantInCorrectWaitingRoomState();

                // Assert
                expect(result).toBeTrue();
            });
        });
    });

    describe('areParticipantsVisible', () => {
        it('should return true when panelStates participants is true', () => {
            component.panelStates = {
                Participants: true,
                Chat: false
            };

            expect(component.areParticipantsVisible).toBeTrue();
        });

        it('should return false when panelStates participants is false', () => {
            component.panelStates = {
                Participants: false,
                Chat: false
            };

            expect(component.areParticipantsVisible).toBeFalse();
        });
    });
});
