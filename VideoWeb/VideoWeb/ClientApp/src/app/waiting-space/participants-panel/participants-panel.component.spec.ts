import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { LowerCasePipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Guid } from 'guid-typescript';
import { MockComponent, MockDirective, MockPipe, ngMocks } from 'ng-mocks';
import { Subject } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { VideoControlService } from 'src/app/services/conference/video-control.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
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
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { MultilinePipe } from 'src/app/shared/pipes/multiline.pipe';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallTestData } from 'src/app/testing/mocks/data/video-call-test-data';
import {
    endpointStatusSubjectMock,
    eventsServiceSpy,
    getParticipantsUpdatedSubjectMock,
    hearingTransferSubjectMock,
    participantHandRaisedStatusSubjectMock,
    participantMediaStatusSubjectMock,
    participantStatusSubjectMock,
    getEndpointsUpdatedMessageSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { onConferenceUpdatedMock, onParticipantUpdatedMock, videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    EndpointStatus,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    VideoEndpointResponse
} from '../../services/clients/api-client';
import { JudgeContextMenuComponent } from '../judge-context-menu/judge-context-menu.component';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { PanelModel } from '../models/panel-model-base';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { ParticipantAlertComponent } from '../participant-alert/participant-alert.component';
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import {
    conferenceParticipantsStatusSubject,
    createParticipantRemoteMuteStoreServiceSpy
} from '../services/mock-participant-remote-mute-store.service';
import { IConferenceParticipantsStatus } from '../models/conference-participants-status';
import { VideoCallService } from '../services/video-call.service';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RoomNamePipe } from 'src/app/shared/pipes/room-name.pipe';
import { EndpointsUpdatedMessage } from 'src/app/shared/models/endpoints-updated-message';
import { UpdateEndpointsDto } from 'src/app/shared/models/update-endpoints-dto';
import { before } from 'node:test';

describe('ParticipantsPanelComponent', () => {
    const testData = new ConferenceTestData();
    const conferenceId = '1111-1111-1111';
    let participants = testData.getListOfParticipants();
    participants = participants.concat(testData.getListOfLinkedParticipants().concat(testData.getListOfLinkedParticipants(true)));
    const endpoints = testData.getListOfEndpoints();
    const videoWebServiceSpy = jasmine.createSpyObj('VideoWebService', [
        'getParticipantsByConferenceId',
        'getEndpointsForConference',
        'getConferenceById'
    ]);
    videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(participants));
    videoWebServiceSpy.getEndpointsForConference.and.returnValue(Promise.resolve(endpoints));
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conferenceId }) } };
    const videocallService = videoCallServiceSpy;
    const eventService = eventsServiceSpy;
    const logger = new MockLogger();
    const translateService = translateServiceSpy;
    let videoControlServiceSpy: jasmine.SpyObj<VideoControlService>;
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let participantPanelModelMapperSpy: jasmine.SpyObj<ParticipantPanelModelMapper>;
    let remoteMuteServiceSpy: jasmine.SpyObj<ParticipantRemoteMuteStoreService>;

    let component: ParticipantsPanelComponent;
    let fixture: ComponentFixture<ParticipantsPanelComponent>;
    const mapper = new ParticipantPanelModelMapper();
    const participantsUpdatedSubject = new Subject<boolean>();

    let hyphenateSpy: jasmine.Spy;
    let translateSpy: jasmine.Spy;
    let lowerCaseSpy: jasmine.Spy;

    beforeAll(() => {
        jasmine.getEnv().allowRespy(true);
    });
    afterAll(() => {
        jasmine.getEnv().allowRespy(false);
    });

    beforeEach(async () => {
        hyphenateSpy = jasmine.createSpy('transform').and.callThrough();
        translateSpy = jasmine.createSpy('transform').and.callThrough();
        lowerCaseSpy = jasmine.createSpy('transform').and.callThrough();

        videoControlServiceSpy = jasmine.createSpyObj<VideoControlService>('VideoControlService', [
            'setHandRaiseStatusById',
            'setSpotlightStatusById',
            'setRemoteMuteStatusById'
        ]);

        participantServiceSpy = jasmine.createSpyObj<ParticipantService>(
            'ParticipantService',
            [],
            ['onParticipantsUpdated$', 'nonEndpointParticipants']
        );

        participantPanelModelMapperSpy = jasmine.createSpyObj<ParticipantPanelModelMapper>('ParticipantPanelModelMapper', [
            'mapFromParticipantModel',
            'mapFromParticipantUserResponseArray'
        ]);
        spyOnProperty(participantServiceSpy, 'onParticipantsUpdated$').and.returnValue(participantsUpdatedSubject.asObservable());
        remoteMuteServiceSpy = createParticipantRemoteMuteStoreServiceSpy();

        await TestBed.configureTestingModule({
            declarations: [
                ParticipantsPanelComponent,
                MockComponent(JudgeContextMenuComponent),
                MockComponent(ParticipantAlertComponent),
                MockComponent(FaIconComponent),
                MockDirective(TooltipDirective),
                MockPipe(TranslatePipe, translateSpy),
                MockPipe(HyphenatePipe, hyphenateSpy),
                MockPipe(LowerCasePipe, lowerCaseSpy),
                MockPipe(MultilinePipe),
                MockPipe(RoomNamePipe)
            ],
            providers: [
                {
                    provide: VideoWebService,
                    useValue: videoWebServiceSpy
                },
                {
                    provide: ActivatedRoute,
                    useValue: activatedRoute
                },
                {
                    provide: VideoCallService,
                    useValue: videocallService
                },
                {
                    provide: VideoControlService,
                    useValue: videoControlServiceSpy
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
                    provide: ParticipantService,
                    useValue: participantServiceSpy
                },
                {
                    provide: TranslateService,
                    useValue: translateService
                },
                {
                    provide: ParticipantPanelModelMapper,
                    useValue: participantPanelModelMapperSpy
                },
                {
                    provide: ParticipantRemoteMuteStoreService,
                    useValue: remoteMuteServiceSpy
                }
            ]
        }).compileComponents();
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
    });

    it('should get participant sorted list, the judge is first, then panel members and finally observers are the last one', fakeAsync(() => {
        const response = new ConferenceResponse({ status: ConferenceStatus.NotStarted });
        videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
        const mappedParticipants = mapper.mapFromParticipantUserResponseArray(participants);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);
        const allJOHs = participants.filter(x => x.role === Role.JudicialOfficeHolder);
        const expectedCount = endpoints.length + participants.length - 2 - (allJOHs.length - 1); // take away 2 interpreters and additional joh

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

    it('should log error when api returns error', async () => {
        videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.reject(participants));
        spyOn(logger, 'error');

        await component.getParticipantsList();

        expect(logger.error).toHaveBeenCalled();
    });

    describe('conferenceParticipantsStatusSubject updated', () => {
        it('should get the remote mute state from the remote mute status service', fakeAsync(() => {
            // Arrange
            const participant = component.participants[0];
            const participantId = participant.id;
            const isMuted = true;
            const response = new ConferenceResponse({ status: ConferenceStatus.NotStarted });
            videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));

            participant.updateParticipant(!isMuted, participant.hasHandRaised(), participant.hasSpotlight());

            const state: IConferenceParticipantsStatus = {};
            state[participantId] = { isRemoteMuted: isMuted };

            component.ngOnInit();
            flush();

            // Act
            conferenceParticipantsStatusSubject.next(state);
            flush();

            // Assert
            expect(participant.isMicRemoteMuted()).toEqual(isMuted);
        }));

        describe('assignPexipId', () => {
            let participant: PanelModel;
            let participantId: string;
            let state: IConferenceParticipantsStatus;

            beforeEach(() => {
                participant = component.participants[0];
                participantId = participant.id;
                spyOn(participant, 'assignPexipId');
                state = {};
                const response = new ConferenceResponse({ status: ConferenceStatus.NotStarted });
                videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(response));
            });

            it('should call assignPexipId when state contains pexipId', fakeAsync(() => {
                const testPexipId = 'testPexipId';
                state[participantId] = { pexipId: testPexipId };

                component.ngOnInit();
                flush();

                // Act
                conferenceParticipantsStatusSubject.next(state);
                flush();

                // Assert
                expect(participant.assignPexipId).toHaveBeenCalledTimes(1);
                expect(participant.assignPexipId).toHaveBeenCalledWith(testPexipId);
            }));

            it('should NOT call assignPexipId when state does not contain pexipId', fakeAsync(() => {
                state[participantId] = { pexipId: undefined };

                component.ngOnInit();
                flush();

                // Act
                conferenceParticipantsStatusSubject.next(state);
                flush();

                // Assert
                expect(participant.assignPexipId).not.toHaveBeenCalled();
            }));
        });
    });

    it('should process eventhub participant updates', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantStatusMessage(pat.id, '', conferenceId, status);

        participantStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.id === message.participantId);
        expect(updatedPat).toBeInstanceOf(ParticipantPanelModel);
        expect((<ParticipantPanelModel>updatedPat).status).toBe(status);
    });

    it('should process eventhub participant updates for linked participant', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const linkedParticipant = participants.filter(
            x => x.role === Role.Individual && x.linked_participants.length > 0 && x.interpreter_room
        )[0];
        const message = new ParticipantStatusMessage(linkedParticipant.id, '', conferenceId, status);

        participantStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.id === linkedParticipant.interpreter_room.id);
        expect(updatedPat).toBeInstanceOf(LinkedParticipantPanelModel);
        const updatedLinked = updatedPat as LinkedParticipantPanelModel;
        expect(updatedLinked.isInConsultation()).toBe(true);
    });

    it('should not process eventhub participant updates not in list', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantStatusMessage(Guid.create().toString(), '', conferenceId, status);

        participantStatusSubjectMock.next(message);

        expect(component.participants.find(x => x.id === message.participantId)).toBeUndefined();
    });

    it('should process eventhub endpoint updates', () => {
        component.setupEventhubSubscribers();
        const status = EndpointStatus.InConsultation;
        const ep = endpoints[0];
        const message = new EndpointStatusMessage(ep.id, conferenceId, status);
        endpointStatusSubjectMock.next(message);

        const updatedEp = component.participants.find(x => x.id === message.endpointId);
        expect(updatedEp).toBeInstanceOf(VideoEndpointPanelModel);
        expect((<VideoEndpointPanelModel>updatedEp).status).toBe(status);
    });

    it('should not process eventhub endpoint updates not in list', () => {
        component.setupEventhubSubscribers();
        const status = EndpointStatus.InConsultation;
        const message = new EndpointStatusMessage(Guid.create().toString(), conferenceId, status);

        endpointStatusSubjectMock.next(message);

        expect(component.participants.find(x => x.id === message.endpointId)).toBeUndefined();
    });

    it('should set transferring in when HearingTransfer In event received', () => {
        component.setupEventhubSubscribers();
        const p = participants[0];
        hearingTransferSubjectMock.next(new HearingTransfer(component.conferenceId, p.id, TransferDirection.In));

        const resultParticipant = component.participants.find(x => x.id === p.id);
        expect(resultParticipant.transferringIn).toBeTrue();
    });

    it('should set transferring in to false when HearingTransfer Out event received', () => {
        component.setupEventhubSubscribers();
        const p = participants[0];
        hearingTransferSubjectMock.next(new HearingTransfer(component.conferenceId, p.id, TransferDirection.Out));

        const resultParticipant = component.participants.find(x => x.id === p.id);
        expect(resultParticipant.transferringIn).toBeFalse();
    });

    it('should handle invalid participant id - HearingTransfer', () => {
        component.setupEventhubSubscribers();
        const currentTrasnferringStatuses = component.participants.map(x => x.transferringIn);
        hearingTransferSubjectMock.next(new HearingTransfer(component.conferenceId, 'InvalidId', TransferDirection.In));
        const afterTrasnferringStatuses = component.participants.map(x => x.transferringIn);
        expect(afterTrasnferringStatuses).toEqual(currentTrasnferringStatuses);
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

        it('should remove from spotlight when in spotlight for a participant when dismissed from a hearing', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            const pat = component.participants.find(p => p.isWitness);
            const hasSpotlight = true;
            pat.updateParticipant(pat.isMicRemoteMuted(), pat.hasHandRaised(), hasSpotlight, pat.id, pat.isLocalMicMuted());
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videoControlServiceSpy.setSpotlightStatusById).toHaveBeenCalledWith(pat.id, pat.pexipId, !hasSpotlight);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, pat.id);
        });

        it('should not remove from spotlight when not in spotlight for a participant when dismissed from a hearing', async () => {
            videocallService.dismissParticipantFromHearing.calls.reset();
            const pat = component.participants.find(p => p.isWitness);
            const hasSpotlight = false;
            pat.updateParticipant(pat.isMicRemoteMuted(), pat.hasHandRaised(), hasSpotlight, pat.id, pat.isLocalMicMuted());
            spyOnProperty(pat, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            await component.dismissParticipantFromHearing(pat);
            expect(videoControlServiceSpy.setSpotlightStatusById).toHaveBeenCalledTimes(0);
            expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, pat.id);
        });
    });

    it('should update conference mute all true', () => {
        component.setupVideoCallSubscribers();
        component.isMuteAll = false;
        const payload = new ConferenceUpdated(true);

        onConferenceUpdatedMock.next(payload);
        expect(component.isMuteAll).toBeTruthy();
    });

    it('should update conference mute all false', () => {
        component.setupVideoCallSubscribers();
        component.isMuteAll = true;
        const payload = new ConferenceUpdated(false);

        onConferenceUpdatedMock.next(payload);
        expect(component.isMuteAll).toBeFalsy();
    });

    describe('handleParticipantUpdatedInVideoCall', () => {
        let pat: PanelModel;
        let pexipParticipant: PexipParticipant;
        let updatedParticipant: ParticipantUpdated;
        beforeEach(() => {
            pat = component.participants.filter(x => x.role !== Role.Judge)[0];
            pexipParticipant = VideoCallTestData.getExamplePexipParticipant(pat.pexipDisplayName);
            updatedParticipant = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        });

        describe('uuid update', () => {
            beforeEach(() => {
                spyOn(pat, 'assignPexipId');
            });

            it('should not assignPexipId when no uuid', () => {
                updatedParticipant.uuid = undefined;
                component.handleParticipantUpdatedInVideoCall(updatedParticipant);
                expect(pat.assignPexipId).not.toHaveBeenCalled();
            });

            it('should assignPexipId when uuid', () => {
                const testUuid = '2ae17bd3-39df-41ae-a382-950d3480ea7c';
                updatedParticipant.uuid = testUuid;
                component.handleParticipantUpdatedInVideoCall(updatedParticipant);

                expect(pat.assignPexipId).toHaveBeenCalledTimes(1);
                expect(pat.assignPexipId).toHaveBeenCalledWith(testUuid);
            });

            it('should handle pexip participant that does not have a display name', () => {
                const user: ParticipantUpdated = { ...updatedParticipant, pexipDisplayName: undefined };
                component.handleParticipantUpdatedInVideoCall(user);
                expect(pat.pexipId).toBeUndefined();
            });
        });
    });

    it('should process video call participant updates', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[0];
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(pat.pexipDisplayName);
        pexipParticipant.is_muted = 'YES';
        pexipParticipant.buzz_time = 1;
        pexipParticipant.spotlight = 1;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.id === pat.id);
        expect(result.pexipId).toBe(payload.uuid);
        expect(result.isMicRemoteMuted()).toBeTruthy();
        expect(result.hasHandRaised()).toBeTruthy();
        expect(result.hasSpotlight()).toBeTruthy();
    });

    it('should process video call participant updates for linked participant and publish remote mute status', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(p => p instanceof LinkedParticipantPanelModel)[0] as LinkedParticipantPanelModel;
        const displayName = `I1;${pat.pexipDisplayName};${pat.id}`;
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant(displayName);
        pexipParticipant.is_muted = 'YES';
        pexipParticipant.buzz_time = 0;
        pexipParticipant.spotlight = 0;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.id === pat.id);
        expect(result.pexipId).toBe(payload.uuid);
        expect(result.isMicRemoteMuted()).toBeTruthy();

        pat.participants.forEach(lp => {
            expect(eventService.publishRemoteMuteStatus).toHaveBeenCalledWith(conferenceId, lp.id, true);
        });
    });

    it('should not process video call participant updates not in list', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[1];
        const pexipParticipant = VideoCallTestData.getExamplePexipParticipant();
        pexipParticipant.is_muted = 'YES';
        pexipParticipant.buzz_time = 1;
        pexipParticipant.spotlight = 1;
        const payload = ParticipantUpdated.fromPexipParticipant(pexipParticipant);

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.id === pat.id);
        expect(result.pexipId).toBeUndefined();
        expect(result.isMicRemoteMuted()).toBeFalsy();
        expect(result.hasHandRaised()).toBeFalsy();
        expect(result.hasSpotlight()).toBeFalsy();
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
        expect(videoControlServiceSpy.setRemoteMuteStatusById).toHaveBeenCalledOnceWith(
            manuallyLockedPat.id,
            manuallyLockedPat.pexipId,
            false
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
        expect(videoControlServiceSpy.setRemoteMuteStatusById).toHaveBeenCalledWith(pat.id, pat.pexipId, true);
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
        it('should call video control service set spotlight status', () => {
            // Arrange
            const panelModel = component.participants[1];
            panelModel.updateParticipant(false, false, false);

            // Act
            component.toggleSpotlightParticipant(panelModel);

            // Assert
            expect(videoControlServiceSpy.setSpotlightStatusById).toHaveBeenCalled();
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
            expect(videoControlServiceSpy.setSpotlightStatusById).not.toHaveBeenCalled();
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
        expect(videoControlServiceSpy.setRemoteMuteStatusById).toHaveBeenCalledWith(pat.id, pat.pexipId, true);
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
            `${p.display_name}<br/>hearing-role.witness participants-panel.for ${p.representee}`
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

    it('should process eventhub device status message for participant in hearing', () => {
        component.setupEventhubSubscribers();
        const mediaStatus = new ParticipantMediaStatus(true, false);
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantMediaStatusMessage(conferenceId, pat.id, mediaStatus);

        participantMediaStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.id === message.participantId);
        expect(updatedPat.isLocalMicMuted()).toBe(mediaStatus.is_local_audio_muted);
        expect(updatedPat.isLocalCameraOff()).toBe(mediaStatus.is_local_video_muted);
    });

    it('should not process eventhub device status message for participant not in list', fakeAsync(() => {
        component.setupEventhubSubscribers();
        const mediaStatus = new ParticipantMediaStatus(true, true);
        const message = new ParticipantMediaStatusMessage(conferenceId, Guid.create().toString(), mediaStatus);
        const beforeMicCount = component.participants.filter(x => x.isLocalMicMuted()).length;
        const beforeCamCount = component.participants.filter(x => x.isLocalCameraOff()).length;

        participantMediaStatusSubjectMock.next(message);
        flushMicrotasks();

        const updatedAudioCount = component.participants.filter(x => x.isLocalMicMuted()).length;
        const updatedVideoCount = component.participants.filter(x => x.isLocalCameraOff()).length;
        expect(updatedAudioCount).toBe(beforeMicCount);
        expect(updatedVideoCount).toBe(beforeCamCount);
    }));

    it('should process event hub hand raise message for participant in hearing', () => {
        component.setupEventhubSubscribers();
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantHandRaisedMessage(conferenceId, pat.id, true);

        participantHandRaisedStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.id === message.participantId);
        expect(updatedPat.hasHandRaised()).toBe(message.handRaised);
    });

    it('should not process event hub hand raise message for participant not in list', () => {
        component.setupEventhubSubscribers();
        const message = new ParticipantHandRaisedMessage(conferenceId, Guid.create().toString(), true);

        participantHandRaisedStatusSubjectMock.next(message);
        const updatedHandRaiseCount = component.participants.filter(x => x.hasHandRaised()).length;
        expect(updatedHandRaiseCount).toBe(0);
    });

    it('should update participants', () => {
        component.nonEndpointParticipants = [];
        const mappedParticipants = mapper.mapFromParticipantUserResponseArray(participants);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);

        component.setupEventhubSubscribers();
        const message = new ParticipantsUpdatedMessage(conferenceId, participants);

        getParticipantsUpdatedSubjectMock.next(message);

        expect(component.nonEndpointParticipants).toEqual(mappedParticipants);
    });

    it('should process eventhub participant updates for panel members added to a hearing when a PM is already present', () => {
        const panelMember1DisplayName = 'Added Panel Member 1';
        const panelMember2DisplayName = 'Added Panel Member 2';

        const panelMember1 = new ParticipantForUserResponse({
            display_name: panelMember1DisplayName,
            first_name: 'Panel',
            role: Role.JudicialOfficeHolder,
            hearing_role: 'Panel Member',
            user_name: 'panel.member@hmcts.net',
            id: '6666-1234-2345-3456'
        });

        const panelMember2 = new ParticipantForUserResponse({
            display_name: panelMember2DisplayName,
            first_name: 'Panel',
            role: Role.JudicialOfficeHolder,
            hearing_role: 'Panel Member',
            user_name: 'panel.member.2@hmcts.net',
            id: '6666-1234-2345-3457'
        });

        participants = participants.filter(x => x.role !== Role.JudicialOfficeHolder);
        participants.push(panelMember1);

        component.nonEndpointParticipants = [];
        let mappedParticipants = mapper.mapFromParticipantUserResponseArray(participants);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);

        component.setupEventhubSubscribers();

        let message = new ParticipantsUpdatedMessage(conferenceId, participants);
        getParticipantsUpdatedSubjectMock.next(message);

        panelMember1.interpreter_room = new RoomSummaryResponse({ id: '14682', label: 'Panel Member1', locked: false });
        participants.push(panelMember2);
        mappedParticipants = mapper.mapFromParticipantUserResponseArray(participants);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);
        message = new ParticipantsUpdatedMessage(conferenceId, participants);
        getParticipantsUpdatedSubjectMock.next(message);

        const linkedParticipantPanelModel = component.nonEndpointParticipants.filter(x => x.role === Role.JudicialOfficeHolder);

        expect(linkedParticipantPanelModel.length).toBe(1);
        expect(linkedParticipantPanelModel[0].displayName).toContain(panelMember1DisplayName);
        expect(linkedParticipantPanelModel[0].displayName).toContain(panelMember2DisplayName);
    });

    it('should remove participants not in conference after participants updated message received', () => {
        const participant1 = new ParticipantForUserResponse({
            display_name: 'Judge 1',
            id: '1111-1111-1111-1111',
            first_name: 'Judge 1',
            role: Role.Judge,
            hearing_role: HearingRole.JUDGE,
            user_name: 'judge1@hmcts.net'
        });

        const participant2 = new ParticipantForUserResponse({
            display_name: 'Judge 2',
            id: '2222-2222-2222-2222',
            first_name: 'Judge 2',
            role: Role.Judge,
            hearing_role: HearingRole.JUDGE,
            user_name: 'judge2@hmcts.net'
        });

        const initialParticipants: PanelModel[] = [];
        initialParticipants.push(mapper.mapFromParticipantUserResponse(participant1));

        const updatedParticipants: ParticipantForUserResponse[] = [];
        updatedParticipants.push(participant2);

        const mappedUpdatedParticipants = mapper.mapFromParticipantUserResponseArray(updatedParticipants);

        component.nonEndpointParticipants = initialParticipants;

        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedUpdatedParticipants);

        component.setupEventhubSubscribers();

        const message = new ParticipantsUpdatedMessage(conferenceId, updatedParticipants);

        getParticipantsUpdatedSubjectMock.next(message);

        expect(component.nonEndpointParticipants).toEqual(mappedUpdatedParticipants);
    });

    it('should persist states for participant after new participant is added', () => {
        /*
        If the states have changed for an existing participant (muted, raised, spotlighted) these should persist after
        a new participant has been added and the participants list refreshed
        */

        const participantsForHearing: ParticipantForUserResponse[] = [];

        const participant1 = new ParticipantForUserResponse({
            id: '1111-1111-1111-1111',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual Judge 26',
            role: Role.Judge,
            representee: null,
            tiled_display_name: 'JUDGE; HEARTBEAT',
            hearing_role: HearingRole.JUDGE,
            linked_participants: []
        });

        const participant2 = new ParticipantForUserResponse({
            id: '2222-2222-2222-2222',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual PanelMember 31',
            interpreter_room: new RoomSummaryResponse({ id: '11466', label: 'Panel Member1', locked: false }),
            role: Role.JudicialOfficeHolder,
            representee: null,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Manual PanelMember 31;d48f753a-b061-4514-ac44-a297a50315bb',
            hearing_role: HearingRole.PANEL_MEMBER,
            linked_participants: []
        });

        const participant3 = new ParticipantForUserResponse({
            id: '3333-3333-3333-3333',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual Individual 25',
            role: Role.Individual,
            representee: null,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Manual Individual 25;92a3d792-dfad-474f-b587-b83766506ec6',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        participantsForHearing.push(participant1);
        participantsForHearing.push(participant2);
        participantsForHearing.push(participant3);

        const panelModelParticipants = new ParticipantPanelModelMapper().mapFromParticipantUserResponseArray(participantsForHearing);
        component.nonEndpointParticipants = panelModelParticipants;

        // Set initial states
        component.nonEndpointParticipants.forEach(p => {
            const initialStates = {
                isRemoteMuted: false,
                handRaised: false,
                spotlighted: false,
                isLocalMicMuted: false,
                isLocalCameraOff: false
            };

            const pexipId = Guid.create().toString();
            p.assignPexipId(pexipId);

            p.updateParticipant(
                initialStates.isRemoteMuted,
                initialStates.handRaised,
                initialStates.spotlighted,
                null,
                initialStates.isLocalMicMuted,
                initialStates.isLocalCameraOff
            );
        });

        const participantsToUpdateState: PanelModel[] = [];
        participantsToUpdateState.push(component.nonEndpointParticipants.find(p => p.id === participant2.interpreter_room.id));
        participantsToUpdateState.push(component.nonEndpointParticipants.find(p => p.id === participant3.id));

        // Update the states
        participantsToUpdateState.forEach(participant => {
            const newStates = {
                isRemoteMuted: true,
                handRaised: true,
                spotlighted: true,
                isLocalMicMuted: true,
                isLocalCameraOff: true
            };

            let participantId = participant.id;
            if (participant instanceof LinkedParticipantPanelModel) {
                participantId = participant.participants[0].id;
            }

            participant.updateParticipant(
                newStates.isRemoteMuted,
                newStates.handRaised,
                newStates.spotlighted,
                participantId,
                newStates.isLocalMicMuted,
                newStates.isLocalCameraOff
            );
        });

        component.participants = [...component.nonEndpointParticipants];

        const newParticipant = new ParticipantForUserResponse({
            id: '4444-4444-4444-4444',
            status: ParticipantStatus.NotSignedIn,
            display_name: 'QL Test 1',
            role: Role.QuickLinkParticipant,
            representee: null,
            tiled_display_name: 'JUDGE; HEARTBEAT',
            hearing_role: 'WITNESS;NO_HEARTBEAT;QL Test 1;ecdbb7ee-ba03-4a78-8225-fdfce2cb14d6',
            linked_participants: []
        });

        participantsForHearing.push(newParticipant);

        const mappedParticipants = mapper.mapFromParticipantUserResponseArray(participantsForHearing);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);

        component.setupEventhubSubscribers();

        const participantsBeforeUpdate = [...component.nonEndpointParticipants];

        const message = new ParticipantsUpdatedMessage(conferenceId, participantsForHearing);
        getParticipantsUpdatedSubjectMock.next(message);

        const panelModelLinkedParticipant = participantsBeforeUpdate.find(p => p.id === participant2.interpreter_room.id);

        const updatedParticipant2 = component.participants.find(p => p.id === participant2.interpreter_room.id);

        expect(updatedParticipant2.isMicRemoteMuted()).toBe(true);
        expect(updatedParticipant2.hasHandRaised()).toBe(true);
        expect(updatedParticipant2.hasSpotlight()).toBe(true);
        expect(updatedParticipant2.isLocalMicMuted()).toBe(true);
        expect(updatedParticipant2.isLocalCameraOff()).toBe(true);
        expect(updatedParticipant2.pexipId).toEqual(panelModelLinkedParticipant.pexipId);

        const updatedParticipant3 = component.participants.find(p => p.id === participant3.id);

        expect(updatedParticipant3.isMicRemoteMuted()).toBe(true);
        expect(updatedParticipant3.hasHandRaised()).toBe(true);
        expect(updatedParticipant3.hasSpotlight()).toBe(true);
        expect(updatedParticipant3.isLocalMicMuted()).toBe(true);
        expect(updatedParticipant3.isLocalCameraOff()).toBe(true);
    });

    it('should persist states for multiple panel members after new participant is added', () => {
        /*
        If the states have changed for an existing participant (muted, raised, spotlighted) these should persist after
        a new participant has been added and the participants list refreshed.

        In this scenario, there are 2 panel members. Panel Member 1 turns off their audio and video, Panel Member 2 does not
        */

        const participantsForHearing: ParticipantForUserResponse[] = [];

        const judge = new ParticipantForUserResponse({
            id: '1111-1111-1111-1111',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual Judge 26',
            role: Role.Judge,
            representee: null,
            tiled_display_name: 'JUDGE; HEARTBEAT',
            hearing_role: HearingRole.JUDGE,
            linked_participants: []
        });

        const linkedParticipantInterpreterRoom = new RoomSummaryResponse({ id: '11466', label: 'Panel Member1', locked: false });

        const panelMember1 = new ParticipantForUserResponse({
            id: '2222-2222-2222-2222',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual PanelMember 31',
            interpreter_room: linkedParticipantInterpreterRoom,
            role: Role.JudicialOfficeHolder,
            representee: null,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Manual PanelMember 31;d48f753a-b061-4514-ac44-a297a50315bb',
            hearing_role: HearingRole.PANEL_MEMBER,
            linked_participants: []
        });

        const panelMember2 = new ParticipantForUserResponse({
            id: '3333-3333-3333-3333',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual PanelMember 32',
            interpreter_room: linkedParticipantInterpreterRoom,
            role: Role.JudicialOfficeHolder,
            representee: null,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Manual PanelMember 31;d48f753a-b061-4514-ac44-a297a50315bb',
            hearing_role: HearingRole.PANEL_MEMBER,
            linked_participants: []
        });

        participantsForHearing.push(judge);
        participantsForHearing.push(panelMember1);
        participantsForHearing.push(panelMember2);

        const panelModelParticipants = new ParticipantPanelModelMapper().mapFromParticipantUserResponseArray(participantsForHearing);
        component.nonEndpointParticipants = panelModelParticipants;

        // Set initial states
        component.nonEndpointParticipants.forEach(p => {
            const initialStates = {
                isRemoteMuted: false,
                handRaised: false,
                spotlighted: false,
                isLocalMicMuted: false,
                isLocalCameraOff: false
            };

            const pexipId = Guid.create().toString();
            p.assignPexipId(pexipId);

            p.updateParticipant(
                initialStates.isRemoteMuted,
                initialStates.handRaised,
                initialStates.spotlighted,
                null,
                initialStates.isLocalMicMuted,
                initialStates.isLocalCameraOff
            );
        });

        const participantsToUpdateState: PanelModel[] = [];
        participantsToUpdateState.push(component.nonEndpointParticipants.find(p => p.id === linkedParticipantInterpreterRoom.id));

        // Update the states - panel member 1 turns off their audio and video
        participantsToUpdateState.forEach(participant => {
            const newStates = {
                isLocalMicMuted: true,
                isLocalCameraOff: true
            };

            participant.updateParticipant(
                participant.isMicRemoteMuted(),
                participant.hasHandRaised(),
                participant.hasSpotlight(),
                panelMember1.id,
                newStates.isLocalMicMuted,
                newStates.isLocalCameraOff
            );
        });

        component.participants = [...component.nonEndpointParticipants];

        const newParticipant = new ParticipantForUserResponse({
            id: '4444-4444-4444-4444',
            status: ParticipantStatus.InHearing,
            display_name: 'Manual PanelMember 33',
            interpreter_room: linkedParticipantInterpreterRoom,
            role: Role.JudicialOfficeHolder,
            representee: null,
            tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;Manual PanelMember 31;d48f753a-b061-4514-ac44-a297a50315bb',
            hearing_role: HearingRole.PANEL_MEMBER,
            linked_participants: []
        });

        participantsForHearing.push(newParticipant);

        const mappedParticipants = mapper.mapFromParticipantUserResponseArray(participantsForHearing);
        participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedParticipants);

        component.setupEventhubSubscribers();

        const participantsBeforeUpdate = [...component.nonEndpointParticipants];

        const message = new ParticipantsUpdatedMessage(conferenceId, participantsForHearing);
        getParticipantsUpdatedSubjectMock.next(message);

        const linkedParticipant = component.participants.find(
            p => p.id === linkedParticipantInterpreterRoom.id
        ) as LinkedParticipantPanelModel;

        const panelModelLinkedParticipant = participantsBeforeUpdate.find(p => p.id === linkedParticipantInterpreterRoom.id);

        expect(linkedParticipant.isMicRemoteMuted()).toBe(false);
        expect(linkedParticipant.hasHandRaised()).toBe(false);
        expect(linkedParticipant.hasSpotlight()).toBe(false);
        expect(linkedParticipant.pexipId).toEqual(panelModelLinkedParticipant.pexipId);

        const updatedPanelMember1 = linkedParticipant.participants.find(p => p.id === panelMember1.id);

        expect(updatedPanelMember1.isMicRemoteMuted()).toBe(false);
        expect(updatedPanelMember1.hasHandRaised()).toBe(false);
        expect(updatedPanelMember1.hasSpotlight()).toBe(false);
        expect(updatedPanelMember1.isLocalMicMuted()).toBe(true);
        expect(updatedPanelMember1.isLocalCameraOff()).toBe(true);

        const updatedPanelMember2 = linkedParticipant.participants.find(p => p.id === panelMember2.id);

        expect(updatedPanelMember2.isMicRemoteMuted()).toBe(false);
        expect(updatedPanelMember2.hasHandRaised()).toBe(false);
        expect(updatedPanelMember2.hasSpotlight()).toBe(false);
        expect(updatedPanelMember2.isLocalMicMuted()).toBe(false);
        expect(updatedPanelMember2.isLocalCameraOff()).toBe(false);

        const updatedPanelMember3 = linkedParticipant.participants.find(p => p.id === newParticipant.id);

        expect(updatedPanelMember3.isMicRemoteMuted()).toBe(undefined);
        expect(updatedPanelMember3.hasHandRaised()).toBe(undefined);
        expect(updatedPanelMember3.hasSpotlight()).toBe(undefined);
        expect(updatedPanelMember3.isLocalMicMuted()).toBe(undefined);
        expect(updatedPanelMember3.isLocalCameraOff()).toBe(undefined);
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

    describe('UI tests', () => {
        describe('Participant panels', () => {
            describe('Admit participant controls', () => {
                let idPrefix;
                let controlsElementId;
                let controlsElement: DebugElement;
                let testPanelModelSpy: jasmine.SpyObj<PanelModel>;
                const testId = 'testId';

                beforeEach(() => {
                    spyOn(component, 'getPanelRowTooltipText').and.returnValue('testToolTipText');
                    testPanelModelSpy = jasmine.createSpyObj<PanelModel>(
                        'ParticipantPanelModel',
                        [
                            'isDisconnected',
                            'isAvailable',
                            'isInHearing',
                            'hasSpotlight',
                            'hasHandRaised',
                            'isLocalCameraOff',
                            'isMicRemoteMuted',
                            'isLocalMicMuted'
                        ],
                        ['id', 'isCallable', 'transferringIn', 'isWitness']
                    );
                    spyOnProperty(testPanelModelSpy, 'id').and.returnValue(testId);

                    component.participants = [testPanelModelSpy];
                    idPrefix = `${component.idPrefix}-${testPanelModelSpy.id}`;
                    controlsElementId = `${idPrefix}-admit-participant-controls`;
                });
                describe('when disconnected', () => {
                    beforeEach(() => {
                        spyOn(testPanelModelSpy, 'isDisconnected').and.returnValue(true);
                        fixture.detectChanges();
                        controlsElement = fixture.debugElement.query(By.css(`#${controlsElementId}`));
                    });
                    it('should not display', () => {
                        expect(controlsElement).toBeFalsy();
                    });
                });
                describe('when connected', () => {
                    beforeEach(() => {
                        spyOn(testPanelModelSpy, 'isDisconnected').and.returnValue(false);
                        fixture.detectChanges();
                        controlsElement = fixture.debugElement.query(By.css(`#${controlsElementId}`));
                    });

                    describe('when should not be visible', () => {
                        afterEach(() => {
                            fixture.detectChanges();
                            controlsElement = fixture.debugElement.query(By.css(`#${controlsElementId}`));
                        });

                        it('should not display when not callable and not in hearing', () => {
                            spyOnProperty(testPanelModelSpy, 'isCallable').and.returnValue(false);
                            spyOn(testPanelModelSpy, 'isInHearing').and.returnValue(false);
                            expect(controlsElement).toBeFalsy();
                        });

                        it('should not display when not callable and in hearing', () => {
                            spyOnProperty(testPanelModelSpy, 'isCallable').and.returnValue(false);
                            spyOn(testPanelModelSpy, 'isInHearing').and.returnValue(true);
                            expect(controlsElement).toBeFalsy();
                        });

                        it('should not display when callable and in hearing', () => {
                            spyOnProperty(testPanelModelSpy, 'isCallable').and.returnValue(true);
                            spyOn(testPanelModelSpy, 'isInHearing').and.returnValue(true);
                            expect(controlsElement).toBeFalsy();
                        });
                    });
                    describe('when callable and not in hearing', () => {
                        let admitParticipantIconId;
                        let transferingInTextId;
                        let participantUnavailableIconId;

                        let admitParticipantIconElement;
                        let transferingInTextElement;
                        let participantUnavailableIconElement;
                        function setElementsToTest() {
                            admitParticipantIconElement = fixture.debugElement.query(By.css(`#${admitParticipantIconId}`));
                            transferingInTextElement = fixture.debugElement.query(By.css(`#${transferingInTextId}`));
                            participantUnavailableIconElement = fixture.debugElement.query(By.css(`#${participantUnavailableIconId}`));
                        }

                        beforeEach(() => {
                            admitParticipantIconId = idPrefix + '-admit-participant-icon';
                            transferingInTextId = idPrefix + '-transferring-in-text';
                            participantUnavailableIconId = idPrefix + '-participant-unavailable-icon';

                            spyOnProperty(testPanelModelSpy, 'isCallable').and.returnValue(true);
                            spyOn(testPanelModelSpy, 'isInHearing').and.returnValue(false);
                            fixture.detectChanges();
                            controlsElement = fixture.debugElement.query(By.css(`#${controlsElementId}`));
                        });
                        it('should display', () => {
                            expect(controlsElement).toBeTruthy();
                        });

                        describe('admitParticipantIconElement', () => {
                            describe('not visisble,', () => {
                                afterEach(() => {
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    expect(admitParticipantIconElement).toBeFalsy();
                                });
                                it('should not be visible when not available and not transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(false);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                });

                                it('should not be visible when available and transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                });

                                it('should not be visible when not available and transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(false);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                });
                            });
                            describe('visisble,', () => {
                                let mockDirective: TooltipDirective;

                                beforeEach(() => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                });

                                it('should be visible when available and not joining', () => {
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    expect(admitParticipantIconElement).toBeTruthy();
                                });

                                it('should display call witness when role is Witness', () => {
                                    const witnessKey = 'participants-panel.call-witness';
                                    const translatedValue = 'translated';
                                    translateSpy.withArgs(witnessKey).and.returnValue(translatedValue);

                                    spyOnProperty(testPanelModelSpy, 'isWitness').and.returnValue(true);
                                    fixture.detectChanges();
                                    setElementsToTest();

                                    mockDirective = ngMocks.get(ngMocks.find(`#${admitParticipantIconId}`), TooltipDirective);
                                    expect(translateSpy).toHaveBeenCalledWith(witnessKey);
                                    expect(mockDirective.text.trim()).toEqual(translatedValue);
                                });

                                it('should display call participant when role is not witness', () => {
                                    const participantKey = 'participants-panel.admit-participant';
                                    const admitParticipantTranslated = 'Admit participant translated';

                                    const testHearingRole = 'Test hearing role';
                                    const testHearingRoleHyphenated = 'test-hearing-role-hyphenated';
                                    const testHearingRoleHyphenatedWithPrefix = `hearing-role.${testHearingRoleHyphenated}`;
                                    const testHearingRoleTranslated = 'Test hearing role translated';
                                    const testHearingRoleTranslatedLowercase = 'test hearing role translated lower case';

                                    hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                    translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);
                                    lowerCaseSpy.withArgs(testHearingRoleTranslated).and.returnValue(testHearingRoleTranslatedLowercase);
                                    translateSpy
                                        .withArgs(participantKey, { role: testHearingRoleTranslatedLowercase })
                                        .and.returnValue(admitParticipantTranslated);

                                    spyOnProperty(testPanelModelSpy, 'isWitness').and.returnValue(false);
                                    testPanelModelSpy.hearingRole = testHearingRole;

                                    fixture.detectChanges();
                                    setElementsToTest();

                                    mockDirective = ngMocks.get(ngMocks.find(`#${admitParticipantIconId}`), TooltipDirective);
                                    expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                    expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                    expect(lowerCaseSpy).toHaveBeenCalledWith(testHearingRoleTranslated);
                                    expect(translateSpy).toHaveBeenCalledWith(participantKey, {
                                        role: testHearingRoleTranslatedLowercase
                                    });
                                    expect(mockDirective.text.trim()).toEqual(admitParticipantTranslated);
                                });

                                it('should call participant when clicked', () => {
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    const callParticipantIntoHearingSpy = spyOn(component, 'callParticipantIntoHearing');
                                    admitParticipantIconElement.nativeElement.click();
                                    expect(callParticipantIntoHearingSpy).toHaveBeenCalledTimes(1);
                                    expect(callParticipantIntoHearingSpy).toHaveBeenCalledWith(testPanelModelSpy);
                                });
                            });
                        });

                        describe('transferringInElement', () => {
                            describe('not visisble,', () => {
                                afterEach(() => {
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    expect(transferingInTextElement).toBeFalsy();
                                });
                                it('should not be visible when not available and not transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(false);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                });

                                it('should not be visible when not available and transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(false);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                });

                                it('should not be visible when available and not transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                });
                            });
                            describe('visisble,', () => {
                                beforeEach(() => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                    fixture.detectChanges();
                                    setElementsToTest();
                                });

                                it('should be visible when available and joining', () => {
                                    expect(transferingInTextElement).toBeTruthy();
                                });
                            });
                        });

                        describe('unavailableIconElement', () => {
                            describe('not visisble,', () => {
                                afterEach(() => {
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    expect(participantUnavailableIconElement).toBeFalsy();
                                });
                                it('should not be visible when available and not transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                });

                                it('should not be visible when available and transferring in', () => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(true);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                });
                            });
                            describe('visisble,', () => {
                                beforeEach(() => {
                                    spyOn(testPanelModelSpy, 'isAvailable').and.returnValue(false);
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(false);
                                    fixture.detectChanges();
                                    setElementsToTest();
                                });

                                it('should be visible when not available and not transferring in', () => {
                                    expect(participantUnavailableIconElement).toBeTruthy();
                                });

                                it('should be visible when not available and transferring in', () => {
                                    spyOnProperty(testPanelModelSpy, 'transferringIn').and.returnValue(true);
                                    fixture.detectChanges();
                                    setElementsToTest();
                                    expect(participantUnavailableIconElement).toBeTruthy();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('getParticipantsList', () => {
        it('should list participants and endpoints in correct order', async () => {
            const judge = new ParticipantResponse({
                current_room: undefined,
                display_name: 'Manual Judge_26',
                first_name: 'Manual',
                hearing_role: 'Judge',
                id: '85dfea9b-d8ec-477e-825f-7e4e3611db99',
                interpreter_room: undefined,
                last_name: 'Judge_26',
                linked_participants: [],
                name: null,
                representee: null,
                role: Role.Judge,
                status: ParticipantStatus.NotSignedIn,
                tiled_display_name: 'JUDGE;HEARTBEAT;Manual Judge_26;85dfea9b-d8ec-477e-825f-7e4e3611db99',
                user_name: null
            });
            const staffMembers = new ConferenceTestData().getFullListOfStaffMembers();
            const nonJudgeParticipants = new ConferenceTestData().getFullListOfNonJudgeParticipants();
            const panelMembers = new ConferenceTestData().getFullListOfPanelMembers();
            const observers = new ConferenceTestData().getFullListOfObservers();
            const fullListOfEndpoints = new ConferenceTestData().getFullListOfEndpoints();

            const fullListOfParticipants = [...staffMembers, ...nonJudgeParticipants, ...panelMembers, ...observers];
            fullListOfParticipants.push(judge);
            const mappedParticipants = fullListOfParticipants.map(p => new ParticipantForUserResponse(p));

            videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(mappedParticipants));
            videoWebServiceSpy.getEndpointsForConference.and.returnValue(Promise.resolve(fullListOfEndpoints));

            const mappedPanelParticipants = mapper.mapFromParticipantUserResponseArray(fullListOfParticipants);
            participantPanelModelMapperSpy.mapFromParticipantUserResponseArray.and.returnValue(mappedPanelParticipants);

            await component.getParticipantsList();

            const participantList = component.participants;
            const endpointList = component.endpointParticipants;

            // Judge
            const judgeIndex = participantList.findIndex(x => x.displayName === 'Manual Judge_26');
            expect(judgeIndex).toEqual(0);

            // Panel members
            const panelMembersIndex = participantList.findIndex(x => x.displayName === 'Mr Panel Member A, Mr Panel Member B');
            expect(panelMembersIndex).toEqual(1);

            // Staff members
            const staffMember1Index = participantList.findIndex(x => x.displayName === 'A StaffMember');
            const staffMember2Index = participantList.findIndex(x => x.displayName === 'B StaffMember');
            const staffMember3Index = participantList.findIndex(x => x.displayName === 'C StaffMember');
            expect(staffMember1Index).toEqual(2);
            expect(staffMember2Index).toEqual(3);
            expect(staffMember3Index).toEqual(4);

            // Non-judge participants
            const applicant1Index = participantList.findIndex(x => x.displayName === 'B, A'); // Litigant in person + Interpreter
            const applicant2Index = participantList.findIndex(x => x.displayName === 'G');
            const respondent1Index = participantList.findIndex(x => x.displayName === 'E');
            const respondent2Index = participantList.findIndex(x => x.displayName === 'F, H');
            const quickLinkParticipant1Index = participantList.findIndex(x => x.displayName === 'Mr C Smith');
            const quickLinkParticipant2Index = participantList.findIndex(x => x.displayName === 'Mr D Smith');
            // No longer sorting appellants and respondents as caseTypesGroups don't exist (arnt populated in real life) so order is more flexible
            const suitableIndicies = [5, 6, 7, 8];
            expect(suitableIndicies.includes(applicant1Index)).toBeTruthy();
            expect(suitableIndicies.includes(applicant2Index)).toBeTruthy();
            expect(suitableIndicies.includes(respondent1Index)).toBeTruthy();
            expect(suitableIndicies.includes(respondent2Index)).toBeTruthy();
            expect(quickLinkParticipant1Index).toEqual(9);
            expect(quickLinkParticipant2Index).toEqual(10);

            // Endpoints
            const endpoint1Index = participantList.findIndex(x => x.displayName === 'Endpoint A');
            const endpoint2Index = participantList.findIndex(x => x.displayName === 'Endpoint B');
            expect(endpoint1Index).toEqual(11);
            expect(endpoint2Index).toEqual(12);

            // Observers
            const observer1Index = participantList.findIndex(x => x.displayName === 'Mr Observer A');
            const observer2Index = participantList.findIndex(x => x.displayName === 'Mr Observer B');
            const qlObserver1Index = participantList.findIndex(x => x.displayName === 'A QL Observer');
            const qlObserver2Index = participantList.findIndex(x => x.displayName === 'QL Observer A');
            expect(observer1Index).toEqual(13);
            expect(observer2Index).toEqual(14);
            expect(qlObserver1Index).toEqual(15);
            expect(qlObserver2Index).toEqual(16);
        });
    });

    describe('EventHub getEndpointsUpdated', () => {
        beforeEach(() => {
            component.setupEventhubSubscribers();
        });
        it('should update endpoint participants when message has been received', fakeAsync(() => {
            // arrange
            const fullListOfEndpoints = new ConferenceTestData().getFullListOfEndpoints();
            fullListOfEndpoints.push(
                new VideoEndpointResponse({
                    display_name: 'Endpoint C',
                    id: 'Endpoint C',
                    status: EndpointStatus.NotYetJoined
                })
            );
            videoWebServiceSpy.getEndpointsForConference.and.returnValue(Promise.resolve(fullListOfEndpoints));

            // act
            getEndpointsUpdatedMessageSubjectMock.next(new EndpointsUpdatedMessage(conferenceId, new UpdateEndpointsDto()));
            tick();
            // assert
            expect(component.endpointParticipants).toContain(jasmine.objectContaining({ displayName: 'Endpoint C' }));
        }));
    });
});
