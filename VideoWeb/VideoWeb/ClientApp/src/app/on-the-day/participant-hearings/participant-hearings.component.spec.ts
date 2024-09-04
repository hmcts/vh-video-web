import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject, Subscription, throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ConferenceForIndividualResponse, LoggedParticipantResponse, Role } from '../../services/clients/api-client';
import { ParticipantHearingsComponent } from './participant-hearings.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { EventsService } from 'src/app/services/events.service';
import { NewConferenceAddedMessage } from 'src/app/services/models/new-conference-added-message';
import { HearingCancelledMessage } from 'src/app/services/models/hearing-cancelled-message';
import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';

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
    const translateService = translateServiceSpy;

    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;
    let hearingVenueIsScottishSubject: BehaviorSubject<boolean>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let newConferenceAddedSpy: jasmine.Spy;
    let hearingCancelledSpy: jasmine.Spy;
    let hearingDetailsUpdatedSpy: jasmine.Spy;
    let participantsUpdatedSpy: jasmine.Spy;
    let addSubscriptionSpy: jasmine.Spy;

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
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [], {
            getNewConferenceAdded: jasmine.createSpy().and.returnValue(of({} as NewConferenceAddedMessage)),
            getHearingCancelled: jasmine.createSpy().and.returnValue(of({} as HearingCancelledMessage)),
            getHearingDetailsUpdated: jasmine.createSpy().and.returnValue(of({} as HearingDetailsUpdatedMessage)),
            getParticipantsUpdated: jasmine.createSpy().and.returnValue(of({} as ParticipantsUpdatedMessage))
        });

        newConferenceAddedSpy = eventsService.getNewConferenceAdded;
        hearingCancelledSpy = eventsService.getHearingCancelled;
        hearingDetailsUpdatedSpy = eventsService.getHearingDetailsUpdated;
        participantsUpdatedSpy = eventsService.getParticipantsUpdated;
    });

    beforeEach(() => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        hearingVenueIsScottishSubject = new BehaviorSubject(false);
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(hearingVenueIsScottishSubject);

        translateService.instant.calls.reset();
        newConferenceAddedSpy.calls.reset();
        hearingCancelledSpy.calls.reset();
        hearingDetailsUpdatedSpy.calls.reset();
        participantsUpdatedSpy.calls.reset();
        videoWebService.getConferencesForIndividual.calls.reset();

        component = new ParticipantHearingsComponent(
            videoWebService,
            errorService,
            router,
            logger,
            translateService,
            mockedHearingVenueFlagsService,
            eventsService
        );
        component.conferences = conferences;
        videoWebService.getConferencesForIndividual.and.returnValue(of(conferences));
        addSubscriptionSpy = spyOn(component.eventHubSubscriptions, 'add').and.callThrough();
    });

    it('calls setHearingVenueIsScottish service when the hearing venue is in scotland', fakeAsync(() => {
        const conference = new ConferenceForIndividualResponse();
        conference.hearing_venue_is_scottish = true;

        component.onConferenceSelected(conference);

        tick(100);

        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(true);
    }));

    it('calls setHearingVenueIsScottish service when the hearing venue is not in scotland', fakeAsync(() => {
        const nextSpy = spyOn(hearingVenueIsScottishSubject, 'next');
        const conference = new ConferenceForIndividualResponse();
        conference.hearing_venue_is_scottish = false;

        component.onConferenceSelected(conference);

        tick(100);

        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(false);
    }));

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

    it('should retrieve conferences and set up subscriptions on init', fakeAsync(() => {
        component.conferences = null;

        component.ngOnInit();
        flushMicrotasks();

        expect(component.conferences).toBe(conferences);
        expect(newConferenceAddedSpy).toHaveBeenCalled();
        expect(hearingCancelledSpy).toHaveBeenCalled();
        expect(hearingDetailsUpdatedSpy).toHaveBeenCalled();
        expect(participantsUpdatedSpy).toHaveBeenCalled();
        expect(addSubscriptionSpy).toHaveBeenCalledTimes(4);
    }));

    it('should retrieve conferences when hearing events are emitted', () => {
        const newConferenceAddedSubject = new Subject<NewConferenceAddedMessage>();
        const hearingCancelledSubject = new Subject<HearingCancelledMessage>();
        const hearingDetailsUpdatedSubject = new Subject<HearingDetailsUpdatedMessage>();
        const participantsUpdatedSubject = new Subject<ParticipantsUpdatedMessage>();
        component.setUpEventHubSubscribers();

        newConferenceAddedSubject.next({} as NewConferenceAddedMessage);
        hearingCancelledSubject.next({} as HearingCancelledMessage);
        hearingDetailsUpdatedSubject.next({} as HearingDetailsUpdatedMessage);
        participantsUpdatedSubject.next({} as ParticipantsUpdatedMessage);

        expect(videoWebService.getConferencesForIndividual).toHaveBeenCalledTimes(4);
    });

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

    it('should clear subscriptions on destroy', () => {
        component.conferencesSubscription = new Subscription();
        component.eventHubSubscriptions = new Subscription();
        const conferencesSubscriptionSpy = spyOn(component.conferencesSubscription, 'unsubscribe');
        const eventHubSubscriptionsSpy = spyOn(component.eventHubSubscriptions, 'unsubscribe');

        component.ngOnDestroy();

        expect(conferencesSubscriptionSpy).toHaveBeenCalled();
        expect(eventHubSubscriptionsSpy).toHaveBeenCalled();
    });
});
