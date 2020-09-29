import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { endpointStatusSubjectMock, eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { videoCallServiceSpy, onConferenceUpdatedMock, onParticipantUpdatedMock } from 'src/app/testing/mocks/mock-video-call-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { EndpointStatus, ParticipantStatus, Role } from '../../services/clients/api-client';
import { ParticipantPanelModel, VideoEndpointPanelModel } from '../models/participant-panel-model';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';

describe('ParticipantsPanelComponent', () => {
    const conferenceId = '1111-1111-1111';
    const participants = new ConferenceTestData().getListOfParticipants();
    const endpoints = new ConferenceTestData().getListOfEndpoints();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj('VideoWebService', ['getParticipantsByConferenceId', 'getEndpointsForConference']);
    videoWebServiceSpy.getParticipantsByConferenceId.and.returnValue(Promise.resolve(participants));
    videoWebServiceSpy.getEndpointsForConference.and.returnValue(Promise.resolve(endpoints));
    const activatedRoute: ActivatedRoute = <any>{ snapshot: { paramMap: convertToParamMap({ conferenceId: conferenceId }) } };
    const videocallService = videoCallServiceSpy;
    const eventService = eventsServiceSpy;
    const logger = new MockLogger();

    let component: ParticipantsPanelComponent;

    beforeEach(() => {
        component = new ParticipantsPanelComponent(videoWebServiceSpy, activatedRoute, videocallService, eventService, logger);
        component.participants = participants.filter(x => x.role !== Role.Judge).map(x => new ParticipantPanelModel(x));

        endpoints.map(endpoint => {
            component.participants = component.participants.concat(new VideoEndpointPanelModel(endpoint));
        });
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

        const updatedPat = component.participants.find(x => x.id === message.participantId);
        expect(updatedPat).toBeInstanceOf(ParticipantPanelModel);
        expect((<ParticipantPanelModel>updatedPat).status).toBe(status);
    });

    it('should not process eventhub participant updates not in list', () => {
        component.setupEventhubSubscribers();
        const status = ParticipantStatus.InConsultation;
        const pat = participants.filter(x => x.role === Role.Individual)[0];
        const message = new ParticipantStatusMessage(Guid.create().toString(), pat.username, conferenceId, status);

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
        const ep = endpoints[0];
        const message = new EndpointStatusMessage(Guid.create().toString(), conferenceId, status);

        endpointStatusSubjectMock.next(message);

        expect(component.participants.find(x => x.id === message.endpointId)).toBeUndefined();
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
        const payload = new ParticipantUpdated('YES', 1, pat.pexipDisplayName, Guid.create().toString(), 1);

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.id === pat.id);
        expect(result.pexipId).toBe(payload.uuid);
        expect(result.isMuted).toBeTruthy();
        expect(result.handRaised).toBeTruthy();
        expect(result.isSpotlighted).toBeTruthy();
    });

    it('should not process video call participant updates not in list', () => {
        component.setupVideoCallSubscribers();
        const pat = component.participants.filter(x => x.role !== Role.Judge)[1];
        const payload = new ParticipantUpdated('YES', 1, 'do_not_exist_display_name', Guid.create().toString(), 0);

        onParticipantUpdatedMock.next(payload);
        const result = component.participants.find(x => x.id === pat.id);
        expect(result.pexipId).toBeUndefined();
        expect(result.isMuted).toBeFalsy();
        expect(result.handRaised).toBeFalsy();
        expect(result.isSpotlighted).toBeFalsy();
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

    it('should spotlight participant', () => {
        const pat = component.participants[1];
        pat.isSpotlighted = false;
        component.toggleSpotlightParticipant(pat);
        expect(videocallService.spotlightParticipant).toHaveBeenCalledWith(pat.pexipId, true);
    });

    it('should not mute conference when any of the second last participant is unmuted manually', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        // Mute all the participants except for one participant
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].isMuted = true;
            (<ParticipantPanelModel>component.participants[index]).status = ParticipantStatus.InHearing;
        }

        // Get any muted participant
        const mutedParticipant = component.participants.filter(x => x.isMuted)[0];
        // Unmute the participant
        component.toggleMuteParticipant(mutedParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    });

    it('should not mute conference when any of the second last participant is muted manually', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        // Unmute all participants except for one participant
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].isMuted = false;
            (<ParticipantPanelModel>component.participants[index]).status = ParticipantStatus.InHearing;
        }

        // Get any unmuted participant
        const unmutedParticipant = component.participants.filter(x => x.isMuted === false)[0];
        // Mute the participant
        component.toggleMuteParticipant(unmutedParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledTimes(0);
    });

    it('should unmute participant', () => {
        const pat = component.participants[0];
        pat.isMuted = false;
        component.toggleMuteParticipant(pat);
        expect(videocallService.muteParticipant).toHaveBeenCalledWith(pat.pexipId, true);
    });

    it('should unmute conference when last participant is unmuted after a conference mute', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        const pat = component.participants.filter(x => x instanceof ParticipantPanelModel)[0] as ParticipantPanelModel;
        pat.isMuted = true;
        pat.status = ParticipantStatus.InHearing;

        component.toggleMuteParticipant(pat);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(false);
    });

    it('should mute conference when last participant is muted manually', () => {
        const lastParticipant = component.participants[component.participants.length - 1];
        for (let index = 0; index < component.participants.length - 1; index++) {
            component.participants[index].isMuted = true;
        }

        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        lastParticipant.isMuted = false;

        component.toggleMuteParticipant(lastParticipant);

        expect(videocallService.muteAllParticipants).toHaveBeenCalledWith(true);
    });

    it('should not unmute conference when second last participant is unmuted after a conference mute', () => {
        videocallService.muteAllParticipants.calls.reset();
        component.isMuteAll = true;
        component.participants.forEach(x => (x.isMuted = true));
        const pat = component.participants[0];
        (<ParticipantPanelModel>pat).status = ParticipantStatus.InHearing;
        component.participants[1].isMuted = true;
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
        pat.handRaised = true;
        component.lowerParticipantHand(pat.id);
        expect(videocallService.lowerHandById).toHaveBeenCalledWith(pat.pexipId);
    });
    it('should scroll up to first participant', () => {
        const dummyElement = document.createElement('div');
        spyOn(dummyElement, 'scrollIntoView').and.callThrough();
        component.firstElement = dummyElement;
        component.scrollUp();
        expect(dummyElement.scrollIntoView).toHaveBeenCalled();
    });
    it('should scroll down to last participant', () => {
        const dummyElement = document.createElement('div');
        spyOn(dummyElement, 'scrollIntoView').and.callThrough();
        component.lastElement = dummyElement;
        component.scrollDown();
        expect(dummyElement.scrollIntoView).toHaveBeenCalled();
    });
    it('should indicate the participant is not visible on screen', () => {
        const dummyElement = document.createElement('div');
        spyOn(dummyElement, 'getBoundingClientRect').and.returnValue(new DOMRect(-15, -15, 0, 0));
        component.lastElement = dummyElement;
        expect(component.isItemOfListVisible(component.lastElement)).toBeFalsy();
    });
    it('should indicate the participant is visible on screen', () => {
        const dummyElement = document.createElement('div');
        spyOn(dummyElement, 'getBoundingClientRect').and.returnValue(new DOMRect(0, 10, 0, 0));
        component.lastElement = dummyElement;
        expect(component.isItemOfListVisible(component.lastElement)).toBeTruthy();
    });

    it('should indicate the scroll down is avaliable', () => {
        const dummyElementUp = document.createElement('div');
        spyOn(dummyElementUp, 'getBoundingClientRect').and.returnValue(new DOMRect(0, 10, 0, 0));
        component.firstElement = dummyElementUp;
        const dummyElementDown = document.createElement('div');
        spyOn(dummyElementDown, 'getBoundingClientRect').and.returnValue(new DOMRect(-15, -15, 0, 0));
        component.lastElement = dummyElementDown;
        component.onScroll();
        expect(component.isScrolling).toBe(1);
    });
    it('should indicate the scroll up is avaliable', () => {
        const dummyElementUp = document.createElement('div');
        spyOn(dummyElementUp, 'getBoundingClientRect').and.returnValue(new DOMRect(-15, -10, 0, 0));
        component.firstElement = dummyElementUp;
        const dummyElementDown = document.createElement('div');
        spyOn(dummyElementDown, 'getBoundingClientRect').and.returnValue(new DOMRect(10, 10, 0, 0));
        component.lastElement = dummyElementDown;
        component.onScroll();
        expect(component.isScrolling).toBe(2);
    });
    it('should indicate the scrolling is down', () => {
        component.initializeScrolling();
        expect(component.isScrolling).toBe(2);
    });
    it('should indicate the scrolling is not need', () => {
        const dummyElementUp = document.createElement('div');
        spyOn(dummyElementUp, 'getBoundingClientRect').and.returnValue(new DOMRect(10, 10, 0, 0));
        component.firstElement = dummyElementUp;
        const dummyElementDown = document.createElement('div');
        spyOn(dummyElementDown, 'getBoundingClientRect').and.returnValue(new DOMRect(10, 10, 0, 0));
        component.lastElement = dummyElementDown;
        component.setScrollingIndicator();
        expect(component.isScrolling).toBe(0);
    });

    it('should set not visible if element of the participant list is  not defined', () => {
        const result = component.isItemOfListVisible(null);
        expect(result).toBe(false);
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
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': Joining');
    });
    it('should getPanelRowTooltipText return "Not Joined" for participant not joined', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Joining;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': Not joined');
    });
    it('should getPanelRowTooltipText return "DISCONNECTED" for disconnected participant', () => {
        const p = participants[0];
        p.status = ParticipantStatus.Disconnected;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name + ': DISCONNECTED');
    });
    it('should getPanelRowTooltipText return displayname as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        expect(component.getPanelRowTooltipText(model)).toContain(p.display_name);
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
});
