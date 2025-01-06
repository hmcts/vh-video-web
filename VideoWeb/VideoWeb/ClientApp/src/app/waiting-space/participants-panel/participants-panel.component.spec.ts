import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { LowerCasePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Guid } from 'guid-typescript';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';
import { of } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { TooltipDirective } from 'src/app/shared/directives/tooltip.directive';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import {
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent,
    LowerParticipantHandEvent,
    ToggleLocalMuteParticipantEvent,
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent
} from 'src/app/shared/models/participant-event';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { MultilinePipe } from 'src/app/shared/pipes/multiline.pipe';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import {
    ConferenceResponse,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from '../../services/clients/api-client';
import { JudgeContextMenuComponent } from '../judge-context-menu/judge-context-menu.component';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { PanelModel } from '../models/panel-model-base';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { ParticipantAlertComponent } from '../participant-alert/participant-alert.component';
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import { createParticipantRemoteMuteStoreServiceSpy } from '../services/mock-participant-remote-mute-store.service';
import { VideoCallService } from '../services/video-call.service';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RoomNamePipe } from 'src/app/shared/pipes/room-name.pipe';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ParticipantsPanelItemComponent } from './participants-panel-item/participants-panel-item.component';
import { ConferenceState } from '../store/reducers/conference.reducer';
import {
    mapConferenceToVHConference,
    mapEndpointToVHEndpoint,
    mapParticipantToVHParticipant
} from '../store/models/api-contract-to-state-model-mappers';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

describe('ParticipantsPanelComponent', () => {
    const testData = new ConferenceTestData();

    let conference: ConferenceResponse;
    let conferenceId: string;
    let participants: ParticipantForUserResponse[];
    let endpoints: VideoEndpointResponse[];

    const videocallService = videoCallServiceSpy;
    const eventService = eventsServiceSpy;
    const logger = new MockLogger();
    const translateService = translateServiceSpy;

    let remoteMuteServiceSpy: jasmine.SpyObj<ParticipantRemoteMuteStoreService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    let component: ParticipantsPanelComponent;
    let fixture: ComponentFixture<ParticipantsPanelComponent>;
    const mapper = new ParticipantPanelModelMapper();

    let initialState: ConferenceState;

    let mockConferenceStore: MockStore<ConferenceState>;

    beforeAll(() => {
        jasmine.getEnv().allowRespy(true);
    });
    afterAll(() => {
        jasmine.getEnv().allowRespy(false);
        mockConferenceStore.resetSelectors();
    });

    beforeEach(async () => {
        conference = testData.getConferenceDetailNow();
        conferenceId = conference.id;

        participants = testData.getListOfParticipants();
        participants = participants.concat(testData.getListOfLinkedParticipants().concat(testData.getListOfLinkedParticipants(true)));
        conference.participants = participants;
        endpoints = conference.endpoints;

        initialState = {
            currentConference: mapConferenceToVHConference(conference),
            availableRooms: [],
            pexipConference: { guestsMuted: true, locked: false, started: true },
            countdownComplete: true
        };

        mockConferenceStore = createMockStore({
            initialState
        });

        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vodafone).and.returnValue(of(false));

        remoteMuteServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        await TestBed.configureTestingModule({
            declarations: [
                ParticipantsPanelComponent,
                MockComponent(JudgeContextMenuComponent),
                MockComponent(ParticipantAlertComponent),
                MockComponent(FaIconComponent),
                MockDirective(TooltipDirective),
                MockPipe(TranslatePipe),
                MockPipe(HyphenatePipe),
                MockPipe(LowerCasePipe),
                MockPipe(MultilinePipe),
                MockPipe(RoomNamePipe),
                MockComponent(ParticipantsPanelItemComponent)
            ],
            providers: [
                {
                    provide: VideoCallService,
                    useValue: videocallService
                },
                {
                    provide: EventsService,
                    useValue: eventService
                },
                {
                    provide: Logger,
                    useValue: logger
                },
                {
                    provide: TranslateService,
                    useValue: translateService
                },
                {
                    provide: ParticipantRemoteMuteStoreService,
                    useValue: remoteMuteServiceSpy
                },
                {
                    provide: LaunchDarklyService,
                    useValue: launchDarklyServiceSpy
                },
                provideMockStore()
            ]
        }).compileComponents();

        mockConferenceStore = TestBed.inject(MockStore);

        mockConferenceStore.overrideSelector(
            ConferenceSelectors.getEndpoints,
            endpoints.map(x => mapEndpointToVHEndpoint(x))
        );

        mockConferenceStore.overrideSelector(
            ConferenceSelectors.getParticipants,
            participants.map(x => mapParticipantToVHParticipant(x))
        );

        mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, initialState.currentConference);
        mockConferenceStore.overrideSelector(ConferenceSelectors.getPexipConference, initialState.pexipConference);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantsPanelComponent);
        component = fixture.componentInstance;

        component.participants = new ParticipantPanelModelMapper().mapFromParticipantUserResponseArray(participants);
        component.conferenceId = conferenceId;
        component.transferTimeout = {};

        endpoints.map(endpoint => {
            component.participants = component.participants.concat(new VideoEndpointPanelModel(endpoint));
        });
        videocallService.muteParticipant.calls.reset();
        translateService.instant.calls.reset();

        fixture.detectChanges();

        component.participants = new ParticipantPanelModelMapper().mapFromParticipantUserResponseArray(participants);
        component.conferenceId = conferenceId;
        component.transferTimeout = {};

        endpoints.map(endpoint => {
            component.participants = component.participants.concat(new VideoEndpointPanelModel(endpoint));
        });
        videocallService.muteParticipant.calls.reset();
        translateService.instant.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
        mockConferenceStore.resetSelectors();
    });

    it('should get participant sorted list, the judge is first, then panel members and finally observers are the last one', fakeAsync(() => {
        const expectedCount = endpoints.length + participants.length;

        component.participants = [];
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants.length).toBe(expectedCount);

        expect(participants.find(x => x.display_name === testData.quickLinkParticipant1.display_name)).toBeTruthy();
        expect(participants.find(x => x.display_name === testData.quickLinkParticipant2.display_name)).toBeTruthy();
        expect(component.participants.findIndex(x => x.displayName === testData.quickLinkParticipant1.display_name)).toBeLessThan(
            component.participants.findIndex(x => x.displayName === testData.quickLinkParticipant2.display_name)
        );

        expect(component.participants[component.participants.length - 2].hearingRole).toBe(HearingRole.OBSERVER);
        expect(component.participants[component.participants.length - 1].role).toBe(Role.QuickLinkObserver);
    }));

    it('should scroll to element', () => {
        const elementId = 'testElement';
        const element = document.createElement('div');
        const scrollSpy = spyOn(element, 'scrollIntoView');
        spyOn(document, 'getElementById').and.returnValue(element);

        component.scrollToElement(elementId);

        expect(document.getElementById).toHaveBeenCalledWith(elementId);
        expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should return true when participant is in hearing', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const pat = mapper.mapFromParticipantUserResponse(p);
        expect(component.isParticipantInHearing(pat)).toBeTruthy();
    });

    it('should return false when participant is not in hearing', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const pat = mapper.mapFromParticipantUserResponse(p);
        expect(component.isParticipantInHearing(pat)).toBeFalsy();
    });

    describe('callParticipantIntoHearing', () => {
        it('should log error if call fails', async () => {
            videocallService.callParticipantIntoHearing.calls.reset();
            spyOn(logger, 'error');
            const error = { status: 401, isApiException: true };
            videocallService.callParticipantIntoHearing.and.returnValue(Promise.reject(error));
            const p = participants[0];
            p.hearing_role = HearingRole.WITNESS;
            p.status = ParticipantStatus.Available;
            const pat = mapper.mapFromParticipantUserResponse(p);
            await component.initiateTransfer(pat);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should call if successful', async () => {
            videocallService.callParticipantIntoHearing.calls.reset();
            const p = participants[0];
            p.hearing_role = HearingRole.WITNESS;
            p.status = ParticipantStatus.Available;
            const pat = mapper.mapFromParticipantUserResponse(p);
            await component.initiateTransfer(pat);
            expect(videocallService.callParticipantIntoHearing).toHaveBeenCalledWith(component.conferenceId, p.id);
        });

        it('should not call a participant in when isCallableAndReadyToJoin is false', async () => {
            const p = participants[0];
            const pat = mapper.mapFromParticipantUserResponse(p);
            spyOnProperty(pat, 'isCallableAndReadyToJoin').and.returnValue(false);
            await component.callParticipantIntoHearing(pat);
            expect(component.transferTimeout[p.id]).toBeUndefined();
        });

        it('should call a participant in when isCallableAndReadyToJoin is true', async () => {
            const p = participants[0];
            const pat = mapper.mapFromParticipantUserResponse(p);
            spyOnProperty(pat, 'isCallableAndReadyToJoin').and.returnValue(true);
            await component.callParticipantIntoHearing(pat);
            expect(eventService.sendTransferRequest).toHaveBeenCalledWith(component.conferenceId, p.id, TransferDirection.In);
        });

        it('should call all linked participants when isCallableAndReadyToJoin', fakeAsync(async () => {
            const pat = component.participants.find(
                p => p instanceof LinkedParticipantPanelModel && p.isWitness
            ) as LinkedParticipantPanelModel;
            spyOnProperty(pat, 'isCallableAndReadyToJoin').and.returnValue(true);
            await component.callParticipantIntoHearing(pat);
            expect(component.transferTimeout[pat.id]).toBeDefined();
            pat.participants.forEach(p => {
                expect(eventService.sendTransferRequest).toHaveBeenCalledWith(component.conferenceId, p.id, TransferDirection.In);
            });
            tick(10000);
            expect(videoCallServiceSpy.callParticipantIntoHearing).toHaveBeenCalledWith(component.conferenceId, pat.witnessParticipant.id);
        }));

        it('should update local mute status to true prior to calling participant into a hearing', fakeAsync(async () => {
            const pat = component.participants.find(
                p => p instanceof LinkedParticipantPanelModel && p.isWitness
            ) as LinkedParticipantPanelModel;
            const isLocalVideoMuted = true;
            pat.participants.forEach(linkedParticipant => {
                component.updateLocalAudioMutedForWitnessInterpreterVmr(linkedParticipant, pat.id, isLocalVideoMuted);
                pat.updateParticipant(false, false, false, pat.id, isLocalVideoMuted, false);
                expect(remoteMuteServiceSpy.updateLocalMuteStatus).toHaveBeenCalledWith(linkedParticipant.id, isLocalVideoMuted, null);
            });
        }));
    });

    describe('dismiss', () => {
        it('should dismiss all linked witness participants when is a witness dismissed from a hearing', fakeAsync(async () => {
            const pat = component.participants.find(
                p => p instanceof LinkedParticipantPanelModel && p.isWitness
            ) as LinkedParticipantPanelModel;
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videoCallServiceSpy.dismissParticipantFromHearing).toHaveBeenCalledWith(
                component.conferenceId,
                pat.witnessParticipant.id
            );
        }));

        it('should dismiss participant in when isCallableAndReadyToBeDismissed is true', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            const pat = component.participants.find(p => p.isWitness);
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, pat.id);
        });

        it('should dismiss participant in when participant is a witness and in hearing and catch error', async () => {
            spyOn(logger, 'error');
            const error = { status: 401, isApiException: true };
            videocallService.dismissParticipantFromHearing.calls.reset();
            videocallService.dismissParticipantFromHearing.and.returnValue(Promise.reject(error));
            const pat = component.participants.find(p => p.isWitness);
            pat.updateStatus(ParticipantStatus.InHearing);
            await component.dismissParticipantFromHearing(pat);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should not dismiss a participant in when isCallableAndReadyToBeDismissed is false', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            const pat = component.participants.find(p => !p.isWitness);
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(false);
            await component.dismissParticipantFromHearing(pat);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledTimes(0);
        });

        it('should lower hand when hand raised for a participant when dismissed from a hearing', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            const pat = component.participants.find(p => p.isWitness);
            const hasHandRaised = true;
            pat.updateParticipant(pat.isMicRemoteMuted(), hasHandRaised, pat.hasSpotlight(), pat.id, pat.isLocalMicMuted());
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videocallService.lowerHandById).toHaveBeenCalledWith(pat.pexipId, component.conferenceId, pat.id);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, pat.id);
        });

        it('should not lower hand when hand not raised for a participant when dismissed from a hearing', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            videocallService.lowerHandById.calls.reset();
            const pat = component.participants.find(p => p.isWitness);
            const hasHandRaised = false;
            pat.updateParticipant(pat.isMicRemoteMuted(), hasHandRaised, pat.hasSpotlight(), pat.id, pat.isLocalMicMuted());
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videocallService.lowerHandById).toHaveBeenCalledTimes(0);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, pat.id);
        });
    });

    it('should unlock all participants', () => {
        // arrange
        component.isMuteAll = true;
        const manuallyLockedPat = component.participants.filter(x => x.role !== Role.Judge)[1];
        spyOn(manuallyLockedPat, 'isInHearing').and.returnValue(true);
        manuallyLockedPat.updateParticipant(true, false, false);
        // act
        component.unlockAll();
        // assert
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(false, component.conferenceId);
        expect(videocallService.muteParticipant).toHaveBeenCalledOnceWith(
            manuallyLockedPat.pexipId,
            false,
            conferenceId,
            manuallyLockedPat.id
        );
    });

    it('should mute all participants', () => {
        component.isMuteAll = false;
        component.muteAndLockAll();
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true, component.conferenceId);
    });

    it('should mute participant', () => {
        const pat = component.participants[0];
        pat.updateParticipant(false, false, false);
        component.toggleMuteParticipant(pat);
        expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledWith(pat.pexipId, true, conferenceId, pat.id);
    });

    describe('handleParticipantMediaStatusChange', () => {
        it('should call updateParticipant for a linked participant witha hearing role interpreter', () => {
            // Arrange
            const mediaStatus = new ParticipantMediaStatus(true, false);
            const interpreter = component.participants.filter(x => x instanceof LinkedParticipantPanelModel)[0];
            const message = new ParticipantMediaStatusMessage(conferenceId, interpreter.id, mediaStatus);
            message.mediaStatus.is_local_audio_muted = true;

            // Act
            component.handleParticipantMediaStatusChange(message);
            // Assert
            expect(interpreter.isLocalMicMuted()).toBe(true);
        });
    });

    describe('toggleSpotlightParticipant', () => {
        beforeEach(() => {
            videoCallServiceSpy.spotlightParticipant.calls.reset();
        });

        it('should call video control service set spotlight status', () => {
            // Arrange
            const panelModel = component.participants[1];
            panelModel.updateParticipant(false, false, false);

            // Act
            component.toggleSpotlightParticipant(panelModel);

            // Assert
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalled();
        });

        it('should NOT call video control service set spotlight status if the participant cannot be found', () => {
            // Arrange
            const participant = mapper.mapFromParticipantUserResponse({
                id: Guid.create().toString(),
                role: Role.Individual,
                hearing_role: HearingRole.LITIGANT_IN_PERSON
            } as ParticipantResponse);

            // Act
            component.toggleSpotlightParticipant(participant);

            // Assert
            expect(videoCallServiceSpy.spotlightParticipant).not.toHaveBeenCalled();
        });
    });

    it('should not mute conference when any of the second last participant is unmuted manually', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        // Mute all the participants except for one participant
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].updateParticipant(true, false, false);
            (<ParticipantPanelModel>component.participants[index]).status = ParticipantStatus.InHearing;
        }

        // Get any muted participant
        const mutedParticipant = component.participants.filter(x => x.isMicRemoteMuted())[0];
        // Unmute the participant
        component.toggleMuteParticipant(mutedParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    });

    it('should not mute conference when any of the second last participant is muted manually', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        // Unmute all participants except for one participant
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].updateParticipant(false, false, false);
            (<ParticipantPanelModel>component.participants[index]).status = ParticipantStatus.InHearing;
        }

        // Get any unmuted participant
        const unmutedParticipant = component.participants.filter(x => x.isMicRemoteMuted() === false)[0];
        // Mute the participant
        component.toggleMuteParticipant(unmutedParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    });

    it('should unmute participant', () => {
        const pat = component.participants[0];
        pat.updateParticipant(false, false, false);
        component.toggleMuteParticipant(pat);
        expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledWith(pat.pexipId, true, conferenceId, pat.id);
    });

    it('should unmute conference when last participant is unmuted after a conference mute', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        const pat = component.participants.filter(x => x instanceof ParticipantPanelModel)[0] as ParticipantPanelModel;
        pat.updateParticipant(true, false, false);
        pat.status = ParticipantStatus.InHearing;

        component.toggleMuteParticipant(pat);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(false, component.conferenceId);
    });

    it('should mute conference when last participant is muted manually', () => {
        const lastParticipant = component.participants[component.participants.length - 1];
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].updateParticipant(true, false, false);
        }

        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        lastParticipant.updateParticipant(false, false, false);

        component.toggleMuteParticipant(lastParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true, component.conferenceId);
    });

    it('should not unmute conference when second last participant is unmuted after a conference mute', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        component.participants.forEach(x => x.updateParticipant(true, false, false));
        const pat = component.participants[0];
        (<ParticipantPanelModel>pat).status = ParticipantStatus.InHearing;
        component.participants[1].updateParticipant(true, false, false);
        (<ParticipantPanelModel>component.participants[1]).status = ParticipantStatus.InHearing;
        component.toggleMuteParticipant(pat);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    });

    it('should lower hand for all participants', () => {
        component.lowerAllHands();
        expect(videocallService.lowerAllHands).toHaveBeenCalled();
    });
    it('should lower hand of participant', () => {
        const pat = component.participants[0];
        pat.updateParticipant(false, true, false);
        component.lowerParticipantHand(pat);
        expect(videocallService.lowerHandById).toHaveBeenCalledWith(pat.pexipId, component.conferenceId, pat.id);
    });
    it('should lower hand for all participants in a room', () => {
        const pat = component.participants.filter(p => p instanceof LinkedParticipantPanelModel)[0] as LinkedParticipantPanelModel;

        component.lowerParticipantHand(pat);

        pat.participants.forEach(lp => {
            expect(eventService.publishParticipantHandRaisedStatus).toHaveBeenCalledWith(conferenceId, lp.id, false);
        });
    });

    it('should return true when participant is disconnected', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const pat = mapper.mapFromParticipantUserResponse(p);
        expect(component.isParticipantDisconnected(pat)).toBeTruthy();
    });
    it('should return false when participant is not disconnected', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const pat = mapper.mapFromParticipantUserResponse(p);
        expect(component.isParticipantDisconnected(pat)).toBeFalsy();
    });
    it('should map the participant panel model to the participant response model', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const ppm = mapper.mapFromParticipantUserResponse(p);
        const pr = component.mapParticipantToParticipantResponse(ppm);
        expect(pr.id).toBe(ppm.id);
        expect(pr.role).toBe(ppm.role);
        expect(pr.status).toBe(ppm.status);
        expect(pr.display_name).toBe(ppm.displayName);
    });

    it('should return true when panelmodel is a video endpoint', () => {
        const panelModel = component.participants.filter(x => x instanceof VideoEndpointPanelModel)[0];
        expect(component.isEndpoint(panelModel)).toBeTruthy();
    });

    it('should return false when panelmodel is a participant', () => {
        const panelModel = component.participants.filter(x => x instanceof ParticipantPanelModel)[0];
        expect(component.isEndpoint(panelModel)).toBeFalsy();
    });

    it('should return false when panelmodel is not linked', () => {
        const panelModel = component.participants.filter(x => x instanceof VideoEndpointPanelModel)[0];
        expect(component.isLinkedParticipantAndAnInterpreter(panelModel)).toBeFalsy();
    });

    it('should return true when panelmodel is linked and an interpreter', () => {
        const panelModel = component.participants.filter(x => x instanceof LinkedParticipantPanelModel && !x.isJudicalOfficeHolder)[0];
        expect(component.isLinkedParticipantAndAnInterpreter(panelModel)).toBeTruthy();
    });

    it('should getPanelRowTooltipText return "Joining" for available participant', () => {
        const p = participants[0];
        p.hearing_role = HearingRole.PANEL_MEMBER;
        p.status = ParticipantStatus.Available;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.joining');
    });

    it('should getPanelRowTooltipText return "Available" for available witness participant', () => {
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.Available;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.participant-available');
    });

    it('should getPanelRowTooltipText return "Not Joined" for participant not joined', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Joining;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.not-joined');
    });
    it('should getPanelRowTooltipText return "DISCONNECTED" for disconnected participant', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.disconnected');
    });
    it('should getPanelRowTooltipText return displayname as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for an individual', () => {
        const p = participants[1];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>hearing-role.litigant-in-person`);
    });
    it('should getPanelRowTooltipAdditionalText return no case role when empty', () => {
        const p = participants[1];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>hearing-role.litigant-in-person`);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for a representative', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(
            `${p.display_name}<br/>hearing-role.litigant-in-person participants-panel.for ${p.representee}`
        );
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for an observer', () => {
        const p = participants[5];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>hearing-role.observer`);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for a panel member', () => {
        const p = participants[6];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}`);
    });
    it('should getPanelRowTooltipAdditionalText return display name for judge', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(p.display_name);
    });
    it('should get red tooltip when participant is disconnected', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('red');
    });
    it('should get blue tooltip when participant is available', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Available;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('blue');
    });
    it('should get blue tooltip when participant is in hearing', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('blue');
    });
    it('should get grey tooltip as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.NotSignedIn;
        const model = mapper.mapFromParticipantUserResponse(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('grey');
    });

    it('should toggle mute participant on event', () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        spyOn(component, 'toggleMuteParticipant');

        // Act
        component.toggleMuteParticipantEventHandler(new ToggleMuteParticipantEvent(model));

        // Assert
        expect(component.toggleMuteParticipant).toHaveBeenCalled();
        expect(component.toggleMuteParticipant).toHaveBeenCalledWith(model);
    });

    it('should toggle local mute participant on event', async () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        model.isLocalMicMuted = () => false;

        // Act
        await component.toggleLocalMuteParticipantEventHandler(new ToggleLocalMuteParticipantEvent(model));

        // Assert
        expect(eventService.updateParticipantLocalMuteStatus).toHaveBeenCalledWith(conferenceId, model.id, true);
    });

    it('should update all participant local mute status', async () => {
        // Act
        await component.updateAllParticipantsLocalMuteStatus(false);

        // Assert
        expect(eventService.updateAllParticipantLocalMuteStatus).toHaveBeenCalledWith(conferenceId, false);
    });

    it('should toggle spotlight participant on event', () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        spyOn(component, 'toggleSpotlightParticipant');

        // Act
        component.toggleSpotlightParticipantEventHandler(new ToggleSpotlightParticipantEvent(model));

        // Assert
        expect(component.toggleSpotlightParticipant).toHaveBeenCalled();
        expect(component.toggleSpotlightParticipant).toHaveBeenCalledWith(model);
    });
    it('should lower participants hand on event', () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        spyOn(component, 'lowerParticipantHand');

        // Act
        component.lowerParticipantHandEventHandler(new LowerParticipantHandEvent(model));

        // Assert
        expect(component.lowerParticipantHand).toHaveBeenCalled();
        expect(component.lowerParticipantHand).toHaveBeenCalledWith(model);
    });
    it('should call witness into hearing on event', () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        spyOn(component, 'callParticipantIntoHearing');

        // Act
        component.callParticipantIntoHearingEventHandler(new CallParticipantIntoHearingEvent(model));

        // Assert
        expect(component.callParticipantIntoHearing).toHaveBeenCalled();
        expect(component.callParticipantIntoHearing).toHaveBeenCalledWith(model);
    });
    it('should dismiss witness from hearing on event', () => {
        // Arrange
        const p = participants[0];
        const model = mapper.mapFromParticipantUserResponse(p);
        spyOn(component, 'dismissParticipantFromHearing');

        // Act
        component.dismissParticipantFromHearingEventHandler(new DismissParticipantFromHearingEvent(model));

        // Assert
        expect(component.dismissParticipantFromHearing).toHaveBeenCalled();
        expect(component.dismissParticipantFromHearing).toHaveBeenCalledWith(model);
    });

    describe('isWitness', () => {
        let participant: PanelModel;
        beforeEach(() => {
            participant = component.participants[0];
        });
        const testCases = [true, false];
        testCases.forEach(testCase => {
            it(`should return ${testCase}`, () => {
                spyOnProperty(participant, 'isWitness').and.returnValue(testCase);
                expect(component.isWitness(participant)).toBe(testCase);
            });
        });
    });
});
