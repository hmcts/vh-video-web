import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subscription, throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { LoggedParticipantResponse, Role } from '../../services/clients/api-client';
import { ParticipantHearingsComponent } from './participant-hearings.component';

describe('ParticipantHearingList', () => {
    let component: ParticipantHearingsComponent;

    const mockCurrentUser: LoggedParticipantResponse = new LoggedParticipantResponse({
        participant_id: '1111-1111-1111-1111',
        display_name: 'John Doe',
        role: Role.Individual
    });
    const mockPanelMemberUser: LoggedParticipantResponse = new LoggedParticipantResponse({
        participant_id: '7777-7777-7777-7777',
        display_name: 'John Doe',
        role: Role.JudicialOfficeHolder
    });
    const mockObserverUser: LoggedParticipantResponse = new LoggedParticipantResponse({
        participant_id: '6666-6666-6666-6666',
        display_name: 'John Doe',
        role: Role.Individual
    });
    const mockWingerUser: LoggedParticipantResponse = new LoggedParticipantResponse({
        participant_id: '4545-4545-4545-4545',
        display_name: 'John Doe',
        role: Role.JudicialOfficeHolder
    });

    const conferences = new ConferenceTestData().getTestData();

    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;
    const logger: Logger = new MockLogger();

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForIndividual',
            'setActiveIndividualConference',
            'getConferenceById',
            'getCurrentParticipant'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(mockCurrentUser));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new ParticipantHearingsComponent(videoWebService, errorService, router, logger);
        component.conferences = conferences;
        videoWebService.getConferencesForIndividual.and.returnValue(of(conferences));
    });

    it('should handle api error with error service when unable to retrieve hearings for individual', fakeAsync(() => {
        videoWebService.getConferencesForIndividual.and.returnValue(throwError({ status: 401, isApiException: true }));
        component.retrieveHearingsForUser();
        expect(component.loadingData).toBeFalsy();
        expect(errorService.handleApiError).toHaveBeenCalled();
    }));

    it('should not skip redirect to error page when failed more than 3 times', () => {
        const error = { status: 401, isApiException: true };
        component.errorCount = 3;
        component.handleApiError(error);
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should show no hearings message when individual has no conferences', fakeAsync(() => {
        videoWebService.getConferencesForIndividual.and.returnValue(of([]));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.hasHearings()).toBeFalsy();
    }));

    it('should retrieve conferences and setup interval on init', fakeAsync(() => {
        component.conferences = null;
        const interval = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
        spyOn(global, 'setInterval').and.returnValue(<any>interval);

        component.ngOnInit();
        flushMicrotasks();

        expect(component.conferences).toBe(conferences);
        expect(setInterval).toHaveBeenCalled();
        expect(component.interval).toBe(interval);
    }));

    it('should show hearings when judge has conferences', () => {
        component.conferences = conferences;
        expect(component.hasHearings()).toBeTruthy();
    });

    it('should navigate to introduction page when conference is selected', fakeAsync(() => {
        const conference = conferences[0];
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));

        component.onConferenceSelected(conference);
        tick(100);
        expect(videoWebService.setActiveIndividualConference).toHaveBeenCalledWith(conference);
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(conference.id);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Introduction, conference.id]);
    }));

    it('should navigate to Waiting room page when conference is selected for panel member', fakeAsync(() => {
        const conference = conferences[0];
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(mockPanelMemberUser));

        component.onConferenceSelected(conference);
        tick(100);
        expect(videoWebService.setActiveIndividualConference).toHaveBeenCalledWith(conference);
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(conference.id);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JOHWaitingRoom, conference.id]);
    }));

    it('should navigate to Waiting room page when conference is selected for observer', fakeAsync(() => {
        const conference = conferences[0];
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(mockObserverUser));

        component.onConferenceSelected(conference);
        tick(100);
        expect(videoWebService.setActiveIndividualConference).toHaveBeenCalledWith(conference);
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(conference.id);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Introduction, conference.id]);
    }));

    it('should go to equipment check without conference id', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck]);
    });

    it('should clear subscriptions and intervals on destroy', () => {
        spyOn(window, 'clearInterval');
        const interval = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component.interval = interval;
        component.conferencesSubscription = new Subscription();
        component.ngOnDestroy();
        expect(clearInterval).toHaveBeenCalledWith(interval);
    });

    it('should navigate to Waiting room page when conference is selected for winger', fakeAsync(() => {
        const conference = conferences[0];
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(mockWingerUser));

        component.onConferenceSelected(conference);
        tick(100);
        expect(videoWebService.setActiveIndividualConference).toHaveBeenCalledWith(conference);
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(conference.id);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JOHWaitingRoom, conference.id]);
    }));
});
