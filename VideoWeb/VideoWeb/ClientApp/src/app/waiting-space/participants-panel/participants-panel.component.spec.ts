import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import {
    CallWitnessIntoHearingEvent,
    DismissWitnessFromHearingEvent,
    LowerParticipantHandEvent,
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent
} from 'src/app/shared/models/participant-event';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallTestData } from 'src/app/testing/mocks/data/video-call-test-data';
import {
    endpointStatusSubjectMock,
    eventsServiceSpy,
    hearingTransferSubjectMock,
    participantHandRaisedStatusSubjectMock,
    participantMediaStatusSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { onConferenceUpdatedMock, onParticipantUpdatedMock, videoCallServiceSpy } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { EndpointStatus, ParticipantStatus, Role } from '../../services/clients/api-client';
import { HearingRole } from '../models/hearing-role-model';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoEndpointPanelModel } from '../models/video-endpoint-panel-model';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';

describe('ParticipantsPanelComponent', () => {
    const testData = new ConferenceTestData();
    const conferenceId = '1111-1111-1111';
    let participants = testData.getListOfParticipants();
    participants = participants.concat(testData.getListOfLinkedParticipants());
    const endpoints = testData.getListOfEndpoints();
    const videoCallTestData = new VideoCallTestData();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj('VideoWebService', ['getParticipantsByConferenceId', 'getEndpointsForConference']);
    videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(participants));
    videoWebServiceSpy.getEndpointsForConference.and.returnValue(Promise.resolve(endpoints));
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conferenceId }) } };
    const videocallService = videoCallServiceSpy;
    const eventService = eventsServiceSpy;
    const logger = new MockLogger();
    const translateService = translateServiceSpy;

    let component: ParticipantsPanelComponent;

    beforeEach(() => {
        component = new ParticipantsPanelComponent(
            videoWebServiceSpy,
            activatedRoute,
            videocallService,
            eventService,
            logger,
            translateService
        );
        component.participants = new ParticipantPanelModelMapper().mapFromParticipantUserResponse(participants);
        component.conferenceId = conferenceId;
        component.witnessTransferTimeout = {};

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
        const expectedCount = endpoints.length + participants.length - 1; // take away 1 for linked participants

        component.participants = [];
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants.length).toBe(expectedCount);
        expect(component.participants[0].caseTypeGroup).toBe('judge');
        expect(component.participants[1].caseTypeGroup).toBe('panelmember');
        expect(component.participants[component.participants.length - 1].caseTypeGroup).toBe('observer');
    }));

    it('should log error when api returns error', async () => {
        videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.reject(participants));
        spyOn(logger, 'error');

        await component.getParticipantsList();

        expect(logger.error).toHaveBeenCalled();
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
            x => x.role === Role.Individual && x.linked_participants.length > 0 && x.current_room
        )[0];
        const message = new ParticipantStatusMessage(linkedParticipant.id, '', conferenceId, status);

        participantStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.id === linkedParticipant.current_room.id);
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
        const pat = new ParticipantPanelModel(p);
        expect(component.isParticipantInHearing(pat)).toBeTruthy();
    });

    it('should return false when participant is not in hearing', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const pat = new ParticipantPanelModel(p);
        expect(component.isParticipantInHearing(pat)).toBeFalsy();
    });

    it('should log error if call witness fails', async () => {
        videocallService.callParticipantIntoHearing.calls.reset();
        spyOn(logger, 'error');
        const error = { status: 401, isApiException: true };
        videocallService.callParticipantIntoHearing.and.returnValue(Promise.reject(error));
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.initiateTransfer(pat);
        expect(logger.error).toHaveBeenCalled();
    });

    it('should log error if call witness fails', async () => {
        videocallService.callParticipantIntoHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.initiateTransfer(pat);
        expect(videocallService.callParticipantIntoHearing).toHaveBeenCalledWith(component.conferenceId, p.id);
    });

    it('should not call a participant in when participant is not a witness', async () => {
        const p = participants[0];
        p.hearing_role = HearingRole.LITIGANT_IN_PERSON;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.callWitnessIntoHearing(pat);
        expect(component.witnessTransferTimeout[p.id]).toBeUndefined();
    });

    it('should not call a participant in when participant is a witness but not available', async () => {
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.NotSignedIn;
        const pat = new ParticipantPanelModel(p);
        await component.callWitnessIntoHearing(pat);
        expect(component.witnessTransferTimeout[p.id]).toBeUndefined();
    });

    it('should call participant in when participant is a witness and available', async () => {
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.callWitnessIntoHearing(pat);
        expect(component.witnessTransferTimeout[p.id]).toBeDefined();
    });

    it('should not call a participant in when participant is not a witness', async () => {
        const p = participants[0];
        p.hearing_role = HearingRole.LITIGANT_IN_PERSON;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.callWitnessIntoHearing(pat);
        expect(component.witnessTransferTimeout[p.id]).toBeUndefined();
    });

    it('should not call a participant in when participant is a witness but not available', async () => {
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.NotSignedIn;
        const pat = new ParticipantPanelModel(p);
        await component.callWitnessIntoHearing(pat);
        expect(component.witnessTransferTimeout[p.id]).toBeUndefined();
    });

    it('should dismiss participant in when participant is a witness and in hearing', async () => {
        videocallService.dismissParticipantFromHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        await component.dismissWitnessFromHearing(pat);
        expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, p.id);
    });

    it('should dismiss participant in when participant is a witness and in hearing and lower hand', async () => {
        videocallService.dismissParticipantFromHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        pat.updateParticipant(false, true, false);
        await component.dismissWitnessFromHearing(pat);
        expect(pat.hasHandRaised()).toBeFalse();
        expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, p.id);
    });

    it('should dismiss participant in when participant is a witness and in hearing and unpin', async () => {
        videocallService.dismissParticipantFromHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        pat.updateParticipant(false, false, true);
        await component.dismissWitnessFromHearing(pat);
        expect(pat.hasSpotlight()).toBeFalse();
        expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledWith(component.conferenceId, p.id);
    });

    it('should dismiss participant in when participant is a witness and in hearing', async () => {
        spyOn(logger, 'error');
        const error = { status: 401, isApiException: true };
        videocallService.dismissParticipantFromHearing.calls.reset();
        videocallService.dismissParticipantFromHearing.and.returnValue(Promise.reject(error));
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        await component.dismissWitnessFromHearing(pat);
        expect(logger.error).toHaveBeenCalled();
    });

    it('should not dismiss a participant in when participant is not a witness', async () => {
        videocallService.dismissParticipantFromHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.LITIGANT_IN_PERSON;
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        await component.dismissWitnessFromHearing(pat);
        expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledTimes(0);
    });

    it('should not dismiss a participant in when participant is a witness but not in hearing', async () => {
        videocallService.dismissParticipantFromHearing.calls.reset();
        const p = participants[0];
        p.hearing_role = HearingRole.WITNESS;
        p.status = ParticipantStatus.Available;
        const pat = new ParticipantPanelModel(p);
        await component.dismissWitnessFromHearing(pat);
        expect(videocallService.dismissParticipantFromHearing).toHaveBeenCalledTimes(0);
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

    it('should process video call participant updates', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[0];
        const pexipParticipant = videoCallTestData.getExamplePexipParticipant(pat.pexipDisplayName);
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
        const pexipParticipant = videoCallTestData.getExamplePexipParticipant(displayName);
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
        const pexipParticipant = videoCallTestData.getExamplePexipParticipant();
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
        component.isMuteAll = true;
        component.unlockAll();
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(false, component.conferenceId);
    });

    it('should mute all participants', () => {
        component.isMuteAll = false;
        component.muteAndLockAll();
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true, component.conferenceId);
    });

    it('should mute participant', () => {
        const pat = component.participants[0];
        pat.updateParticipant(true, false, false);
        component.toggleMuteParticipant(pat);
        expect(videocallService.muteParticipant).toHaveBeenCalledWith(pat.pexipId, false, component.conferenceId, pat.id);
    });

    it('should spotlight participant', () => {
        const pat = component.participants[1];
        pat.updateParticipant(false, false, false);
        component.toggleSpotlightParticipant(pat);
        expect(videocallService.spotlightParticipant).toHaveBeenCalledWith(pat.pexipId, true, component.conferenceId, pat.id);
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
        expect(videocallService.muteParticipant).toHaveBeenCalledWith(pat.pexipId, true, component.conferenceId, pat.id);
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
        const pat = new ParticipantPanelModel(p);
        expect(component.isParticipantDisconnected(pat)).toBeTruthy();
    });
    it('should return false when participant is not disconnected', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const pat = new ParticipantPanelModel(p);
        expect(component.isParticipantDisconnected(pat)).toBeFalsy();
    });
    it('should map the participant panel model to the participant response model', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const ppm = new ParticipantPanelModel(p);
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

    it('should getPanelRowTooltipText return "Joining" for available participant', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Available;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.joining');
    });
    it('should getPanelRowTooltipText return "Not Joined" for participant not joined', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Joining;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.not-joined');
    });
    it('should getPanelRowTooltipText return "DISCONNECTED" for disconnected participant', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': participants-panel.disconnected');
    });
    it('should getPanelRowTooltipText return displayname as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for an individual', () => {
        const p = participants[1];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>${p.hearing_role}<br/>${p.case_type_group}`);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for a representative', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(
            `${p.display_name}<br/>${p.hearing_role} participants-panel.for ${p.representee}<br/>${p.case_type_group}`
        );
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for an observer', () => {
        const p = participants[5];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>${p.hearing_role}`);
    });
    it('should getPanelRowTooltipAdditionalText return hearing role and case role for a panel member', () => {
        const p = participants[6];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(`${p.display_name}<br/>${p.hearing_role}`);
    });
    it('should getPanelRowTooltipAdditionalText return display name for judge', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toEqual(p.display_name);
    });
    it('should get red tooltip when participant is disconnected', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('red');
    });
    it('should get blue tooltip when participant is available', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Available;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('blue');
    });
    it('should get blue tooltip when participant is in hearing', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('blue');
    });
    it('should get grey tooltip as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.NotSignedIn;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipColour(model)).toBe('grey');
    });

    it('should toggle mute participant on event', () => {
        // Arrange
        const p = participants[0];
        const model = new ParticipantPanelModel(p);
        spyOn(component, 'toggleMuteParticipant');

        // Act
        component.toggleMuteParticipantEventHandler(new ToggleMuteParticipantEvent(model));

        // Assert
        expect(component.toggleMuteParticipant).toHaveBeenCalled();
        expect(component.toggleMuteParticipant).toHaveBeenCalledWith(model);
    });
    it('should toggle spotlight participant on event', () => {
        // Arrange
        const p = participants[0];
        const model = new ParticipantPanelModel(p);
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
        const model = new ParticipantPanelModel(p);
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
        const model = new ParticipantPanelModel(p);
        spyOn(component, 'callWitnessIntoHearing');

        // Act
        component.callWitnessIntoHearingEventHandler(new CallWitnessIntoHearingEvent(model));

        // Assert
        expect(component.callWitnessIntoHearing).toHaveBeenCalled();
        expect(component.callWitnessIntoHearing).toHaveBeenCalledWith(model);
    });
    it('should dismiss witness from hearing on event', () => {
        // Arrange
        const p = participants[0];
        const model = new ParticipantPanelModel(p);
        spyOn(component, 'dismissWitnessFromHearing');

        // Act
        component.dismissWitnessFromHearingEventHandler(new DismissWitnessFromHearingEvent(model));

        // Assert
        expect(component.dismissWitnessFromHearing).toHaveBeenCalled();
        expect(component.dismissWitnessFromHearing).toHaveBeenCalledWith(model);
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
});
