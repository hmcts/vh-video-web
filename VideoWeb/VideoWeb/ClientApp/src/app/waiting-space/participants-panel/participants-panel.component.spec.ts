import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { LowerCasePipe } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
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
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { MultilinePipe } from 'src/app/shared/pipes/multiline.pipe';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ConferenceResponse, ParticipantForUserResponse, ParticipantStatus, Role } from '../../services/clients/api-client';
import { JudgeContextMenuComponent } from '../judge-context-menu/judge-context-menu.component';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { PanelModel } from '../models/panel-model-base';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { ParticipantAlertComponent } from '../participant-alert/participant-alert.component';

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
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { VHEndpoint } from '../store/models/vh-conference';

describe('ParticipantsPanelComponent', () => {
    const testData = new ConferenceTestData();

    let conference: ConferenceResponse;
    let conferenceId: string;
    let participants: ParticipantForUserResponse[];
    let endpoints: VHEndpoint[];

    const eventService = eventsServiceSpy;
    const logger = new MockLogger();
    const translateService = translateServiceSpy;

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
        endpoints = conference.endpoints.map(x => mapEndpointToVHEndpoint(x));

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
                    provide: LaunchDarklyService,
                    useValue: launchDarklyServiceSpy
                },
                provideMockStore()
            ]
        }).compileComponents();

        mockConferenceStore = TestBed.inject(MockStore);

        mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, endpoints);

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

        endpoints.map(endpoint => {
            component.participants = component.participants.concat(new VideoEndpointPanelModel(endpoint));
        });
        translateService.instant.calls.reset();

        fixture.detectChanges();

        component.participants = new ParticipantPanelModelMapper().mapFromParticipantUserResponseArray(participants);
        component.conferenceId = conferenceId;

        endpoints.map(endpoint => {
            component.participants = component.participants.concat(new VideoEndpointPanelModel(endpoint));
        });
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
        it('should dispatch action to admit a participant', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);

            // act
            component.callParticipantIntoHearing(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.admitParticipant({ participantId: participant.id })
            );
        });
    });

    describe('dismissParticipantFromHearing', () => {
        it('should dispatch action to dismiss a participant in the hearing', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateStatus(ParticipantStatus.InHearing);

            // act
            component.dismissParticipantFromHearing(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.dismissParticipant({ participantId: participant.id })
            );
        });

        it('should not dispatch action to dismiss a participant not in the hearing', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateStatus(ParticipantStatus.Available);

            // act
            component.dismissParticipantFromHearing(participant);

            // assert
            expect(mockConferenceStore.dispatch).not.toHaveBeenCalled();
        });
    });

    describe('unlockAll', () => {
        it('should dispatch action to unlock the remote mute', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');

            // act
            component.unlockAll();

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(VideoCallHostActions.unlockRemoteMute());
        });
    });

    describe('muteAndLockAll', () => {
        it('should dispatch action to mute and lock all participants', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');

            // act
            component.muteAndLockAll();

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(VideoCallHostActions.remoteMuteAndLockAllParticipants());
        });
    });

    describe('toggleMuteParticipant', () => {
        it('should dispatch action to unlock the remote mute of a participant who is remote muted', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateParticipant(true, false, false);

            // act
            component.toggleMuteParticipant(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.unlockRemoteMuteForParticipant({ participantId: participant.id })
            );
        });

        it('should dispatch action to remote mute a participant who is not remote muted', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateParticipant(false, false, false);

            // act
            component.toggleMuteParticipant(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.lockRemoteMuteForParticipant({ participantId: participant.id })
            );
        });
    });

    describe('updateAllParticipantsLocalMuteStatus', () => {
        it('should dispatch action to update all participants local mute status', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');

            // act
            component.localMuteAllParticipants();

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(VideoCallHostActions.localMuteAllParticipants());
        });

        it('should dispatch action to update all participants local unmute status', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');

            // act
            component.localUnmuteAllParticipants();

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(VideoCallHostActions.localUnmuteAllParticipants());
        });
    });

    describe('toggleSpotlightParticipant', () => {
        it('should dispatch action to spotlight a participant who is not spotlighted', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateParticipant(false, false, false);

            // act
            component.toggleSpotlightParticipant(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.spotlightParticipant({ participantId: participant.id })
            );
        });

        it('should dispatch action to unspotlight a participant who is spotlighted', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);
            participant.updateParticipant(false, false, true);

            // act
            component.toggleSpotlightParticipant(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.removeSpotlightForParticipant({ participantId: participant.id })
            );
        });
    });

    describe('lowerAllHands', () => {
        it('should dispatch action to lower all hands', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');

            // act
            component.lowerAllHands();

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(VideoCallHostActions.lowerAllParticipantHands());
        });
    });

    describe('lowerParticipantHand', () => {
        it('should dispatch action to lower a participant hand', () => {
            // arrange
            spyOn(mockConferenceStore, 'dispatch');
            const participant = component.participants.find(x => x instanceof ParticipantPanelModel);

            // act
            component.lowerParticipantHand(participant);

            // assert
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                VideoCallHostActions.lowerParticipantHand({ participantId: participant.id })
            );
        });
    });

    // it('should mute conference when last participant is muted manually', () => {
    //     const lastParticipant = component.participants[component.participants.length - 1];
    //     for (let index = 0; index < component.participants.length - 1; index++) {
    //         component.participants[index].updateParticipant(true, false, false);
    //     }

    //     videocallService.muteAllParticipants.calls.reset();
    //     component.isMuteAll = true;
    //     lastParticipant.updateParticipant(false, false, false);

    //     component.toggleMuteParticipant(lastParticipant);

    //     expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true, component.conferenceId);
    // });

    // it('should not unmute conference when second last participant is unmuted after a conference mute', () => {
    //     videocallService.muteAllParticipants.calls.reset();
    //     component.isMuteAll = true;
    //     component.participants.forEach(x => x.updateParticipant(true, false, false));
    //     const pat = component.participants[0];
    //     (<ParticipantPanelModel>pat).status = ParticipantStatus.InHearing;
    //     component.participants[1].updateParticipant(true, false, false);
    //     (<ParticipantPanelModel>component.participants[1]).status = ParticipantStatus.InHearing;
    //     component.toggleMuteParticipant(pat);

    //     expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    // });

    describe('isParticipantDisconnected', () => {
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

    it('should getPanelRowTooltipText return "Available" for available expert participant', () => {
        const p = participants[0];
        p.hearing_role = HearingRole.EXPERT;
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
