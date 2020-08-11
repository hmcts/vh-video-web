import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy, onConferenceUpdatedMock, onParticipantUpdatedMock } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ParticipantStatus, Role } from '../../services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';

describe('ParticipantsPanelComponent', () => {
    const conferenceId = '1111-1111-1111';
    const participants = new ConferenceTestData().getListOfParticipants();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj('VideoWebService', ['getParticipantsByConferenceId']);
    videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(participants));
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conferenceId }) } };
    const videocallService = videoCallServiceSpy;
    const eventService = eventsServiceSpy;
    const logger = new MockLogger();

    let component: ParticipantsPanelComponent;

    beforeEach(() => {
        component = new ParticipantsPanelComponent(videoWebServiceSpy, activatedRoute, videocallService, eventService, logger);
        component.participants = participants
            .filter(x => x.role !== Role.Judge)
            .map(x => new ParticipantPanelModel(x.id, x.display_name, x.role, x.case_type_group, x.status, x.pexip_display_name));
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should get participant sorted list, the panel members are the first and observers are the last one', fakeAsync(() => {
        component.participants = [];
        component.ngOnInit();
        flushMicrotasks();

        expect(component.participants.length).toBeGreaterThan(0);
        expect(component.participants[0].caseTypeGroup).toBe('panelmember');
        expect(component.participants[component.participants.length - 1].caseTypeGroup).toBe('observer');
    }));

    it('should list of participant not include judge', fakeAsync(() => {
        component.participants = [];
        component.ngOnInit();
        flushMicrotasks();

        expect(component.participants.length).toBeGreaterThan(0);
        expect(component.participants.findIndex(x => x.role === Role.Judge)).toBe(-1);
    }));

    it('should log error when api returns error', async () => {
        videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.reject(participants));
        spyOn(logger, 'error');

        await component.getParticipantsList();

        expect(logger.error).toHaveBeenCalled();
    });

    it('should toggle collaps or expand panel', () => {
        const currentValue = component.expandPanel;
        component.toggleCollapseExpand();
        expect(component.expandPanel).toBe(!currentValue);
    });

    it('should mute on toggle and change text to mute all ', () => {
        component.isMuteAll = false;
        expect(component.muteAllToggleText).toBe('Mute all');
    });

    it('should unmute on toggle add set text to Unmute all', () => {
        component.isMuteAll = true;
        expect(component.muteAllToggleText).toBe('Unmute all');
    });

    it('should process eventhub participant updates', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantStatusMessage(pat.id, pat.username, conferenceId, status);

        participantStatusSubjectMock.next(message);

        const updatedPat = component.participants.find(x => x.participantId === message.participantId);
        expect(updatedPat.status).toBe(status);
    });

    it('should not process eventhub participant updates not in list', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantStatusMessage(Guid.create().toString(), pat.username, conferenceId, status);

        participantStatusSubjectMock.next(message);

        expect(component.participants.find(x => x.participantId === message.participantId)).toBeUndefined();
    });

    it('should return true when participant is in hearing', () => {
        const pat = new ParticipantPanelModel('1111', 'test run', Role.Individual, 'group1', ParticipantStatus.InHearing, 'pexipName');
        expect(component.isParticipantInHearing(pat)).toBeTruthy();
    });

    it('should return false when participant is not in hearing', () => {
        const pat = new ParticipantPanelModel('1111', 'test run', Role.Individual, 'group1', ParticipantStatus.Disconnected, 'pexipName');
        expect(component.isParticipantInHearing(pat)).toBeFalsy();
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
        const payload = new ParticipantUpdated('YES', 1, pat.pexipDisplayName, Guid.create().toString());

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.participantId === pat.participantId);
        expect(result.pexipId).toBe(payload.uuid);
        expect(result.isMuted).toBeTruthy();
        expect(result.handRaised).toBeTruthy();
    });

    it('should display unmute all when at least one participant is muted', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[0];
        const payload = new ParticipantUpdated('YES', 1, pat.pexipDisplayName, Guid.create().toString());

        onParticipantUpdatedMock.next(payload);
        expect(component.isMuteAll).toBeTruthy();
    });

    it('should not process video call participant updates not in list', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[1];
        const payload = new ParticipantUpdated('YES', 1, 'do_not_exist_display_name', Guid.create().toString());

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.participantId === pat.participantId);
        expect(result.pexipId).toBeUndefined();
        expect(result.isMuted).toBeFalsy();
        expect(result.handRaised).toBeFalsy();
    });

    it('should unmute all participants', () => {
        component.isMuteAll = true;
        component.toggleMuteAll();
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(false);
    });

    it('should mute all participants', () => {
        component.isMuteAll = false;
        component.toggleMuteAll();
        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true);
    });

    it('should mute participant', () => {
        const pat = component.participants[0];
        pat.isMuted = true;
        component.toggleMuteParticipant(pat);
        expect(videocallService.muteParticipant).toHaveBeenCalledWith(pat.pexipId, false);
    });

    it('should unmute participant', () => {
        const pat = component.participants[0];
        pat.isMuted = false;
        component.toggleMuteParticipant(pat);
        expect(videocallService.muteParticipant).toHaveBeenCalledWith(pat.pexipId, true);
    });
    it('should lower hand for all participants', () => {
        component.lowerAllHands();
        expect(videocallService.lowerAllHands).toHaveBeenCalled();
    });
    it('should lower hand of participant', () => {
        const pat = component.participants[0];
        pat.handRaised = true;
        component.lowerParticipantHand(pat.participantId);
        expect(videocallService.lowerHandById).toHaveBeenCalledWith(pat.pexipId);
    });
});
