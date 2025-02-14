import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of } from 'rxjs';
import { ParticipantsUpdatedMessage } from '../shared/models/participants-updated-message';
import {
    eventHubReconnectSubjectMock,
    eventsServiceSpy,
    getParticipantsUpdatedSubjectMock,
    hearingLayoutChangedSubjectMock
} from '../testing/mocks/mock-events-service';
import { ApiClient, HearingLayout } from './clients/api-client';
import { HearingLayoutService } from './hearing-layout.service';
import { Logger } from './logging/logger-base';
import { HearingLayoutChanged } from './models/hearing-layout-changed';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { ConferenceState, initialState as initialConferenceState } from '../waiting-space/store/reducers/conference.reducer';
import { VHConference } from '../waiting-space/store/models/vh-conference';
import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../waiting-space/store/models/api-contract-to-state-model-mappers';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import { cold } from 'jasmine-marbles';

describe('HearingLayoutService', () => {
    let service: HearingLayoutService;

    const testData = new ConferenceTestData();
    let conference: VHConference;
    let initialConferenceId: string;
    let mockConferenceStore: MockStore<ConferenceState>;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    const initialLayout = HearingLayout.Dynamic;
    const initialRecommendedLayout = HearingLayout.Dynamic;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getLayoutForHearing', 'updateLayoutForHearing', 'getRecommendedLayoutForHearing']);

        const initialState = initialConferenceState;
        mockConferenceStore = createMockStore({ initialState });

        conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        initialConferenceId = conference.id;
        mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);

        apiClientSpy.getLayoutForHearing.and.returnValue(of(initialLayout));
        apiClientSpy.getRecommendedLayoutForHearing.and.returnValue(of(initialRecommendedLayout));
        apiClientSpy.updateLayoutForHearing.and.returnValue(of(void 0));

        service = new HearingLayoutService(
            jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']),
            apiClientSpy,
            mockConferenceStore,
            eventsServiceSpy
        );
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('on initialisation', () => {
        it('should of fetched the current layout', () => {
            // Assert
            const expected = cold('a', { a: initialLayout });
            expect(service.recommendedLayout$).toBeObservable(expected);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
        });
    });

    describe('on event hub connected', () => {
        beforeEach(() => {
            apiClientSpy.getLayoutForHearing.calls.reset();
        });

        it('should update the current layout', fakeAsync(() => {
            // Arrange
            const expectedLayout = HearingLayout.TwoPlus21;
            apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

            // Act
            let currentLayout: HearingLayout | null = null;
            service.currentLayout$.subscribe(layout => (currentLayout = layout));

            eventHubReconnectSubjectMock.next();
            flush();

            // Assert
            expect(currentLayout).toBeTruthy();
            expect(currentLayout).toEqual(expectedLayout);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
        }));
    });

    describe('after initialisation', () => {
        it('should update recommended layout when participants list is updated', () => {
            // Arrange
            const newRecommendedLayout = HearingLayout.TwoPlus21;
            apiClientSpy.getRecommendedLayoutForHearing.and.returnValue(of(newRecommendedLayout));

            // Act
            getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conference.id, []));

            // Assert
            const expected = cold('a', { a: newRecommendedLayout });
            expect(service.recommendedLayout$).toBeObservable(expected);
        });

        it('should update the current layout when the layout is changed', () => {
            // Arrange
            const newLayout = HearingLayout.TwoPlus21;
            const changedById = Guid.create().toString();
            apiClientSpy.getLayoutForHearing.and.returnValue(of(newLayout));

            // Act
            hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(initialConferenceId, changedById, newLayout));

            // Assert
            const expected = cold('a', { a: newLayout });
            expect(service.currentLayout$).toBeObservable(expected);
        });
    });

    describe('updateCurrentLayout', () => {
        it('shouuld call the api to update the layout', () => {
            // Arrange
            const layout = HearingLayout.TwoPlus21;

            // Act
            service.updateCurrentLayout(layout);

            // Assert
            expect(apiClientSpy.updateLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId, layout);
        });
    });

    // describe('after initialisation', () => {
    //     describe('on hearingLayoutChanged recieved on event bus', () => {
    //         it('should emit the new layout from currentLayout$ when it is for the current conference', fakeAsync(() => {
    //             // Arrange
    //             const expectedLayout = HearingLayout.OnePlus7;
    //             const changedById = Guid.create().toString();
    //             apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

    //             // Act
    //             hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(initialConferenceId, changedById, expectedLayout));
    //             flush();

    //             let currentLayout: HearingLayout | null = null;
    //             service.currentLayout$.subscribe(layout => (currentLayout = layout));

    //             // Assert
    //             expect(currentLayout).toEqual(expectedLayout);
    //         }));

    //         it('should NOT emit the new layout from currentLayout$ when it is NOT for the current conference', fakeAsync(() => {
    //             // Arrange
    //             const unexpectedLayout = HearingLayout.OnePlus7;

    //             // Act
    //             hearingLayoutChangedSubjectMock.next(
    //                 new HearingLayoutChanged(Guid.create().toString(), Guid.create().toString(), unexpectedLayout)
    //             );
    //             flush();

    //             let currentLayout: HearingLayout | null = null;
    //             service.currentLayout$.subscribe(layout => (currentLayout = layout));

    //             // Assert
    //             expect(currentLayout).toEqual(initialLayout);
    //         }));

    //         it('should filter for the new conference when the conference changes and NOT emit the new layout from currentLayout$ when it is NOT for the new conference', fakeAsync(() => {
    //             // Arrange
    //             const unexpectedLayout = HearingLayout.TwoPlus21;

    //             const conferenceId = Guid.create().toString();
    //             const changedById = Guid.create().toString();
    //             const newConference = { ...conference, id: conferenceId } as VHConference;

    //             // Act
    //             mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, newConference);
    //             flush();

    //             hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(initialConferenceId, changedById, unexpectedLayout));
    //             flush();

    //             let currentLayout: HearingLayout | null = null;
    //             service.currentLayout$.subscribe(layout => (currentLayout = layout));

    //             // Assert
    //             expect(currentLayout).toEqual(initialLayout);
    //         }));

    //         it('should filter for the new conference when the conference changes and emit the new layout from currentLayout$ when it is for the new conference', fakeAsync(() => {
    //             // Arrange
    //             const expectedLayout = HearingLayout.TwoPlus21;

    //             const conferenceId = Guid.create().toString();
    //             const changedById = Guid.create().toString();
    //             const newConference = { ...conference, id: conferenceId } as VHConference;

    //             // Act
    //             mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, newConference);
    //             flush();

    //             hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(conferenceId, changedById, expectedLayout));
    //             flush();

    //             let currentLayout: HearingLayout | null = null;
    //             service.currentLayout$.subscribe(layout => (currentLayout = layout));

    //             // Assert
    //             expect(currentLayout).toEqual(expectedLayout);
    //         }));
    //     });

    //     describe('getCurrentLayout', () => {
    //         beforeEach(() => {
    //             apiClientSpy.getLayoutForHearing.calls.reset();
    //         });

    //         it('should get the current conference id and retrive the layout for it', fakeAsync(() => {
    //             // Arrange
    //             const expectedLayout = HearingLayout.OnePlus7;

    //             apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

    //             // Act
    //             let currentLayout: HearingLayout | null = null;
    //             service.getCurrentLayout().subscribe(layout => (currentLayout = layout));
    //             flush();

    //             // Assert
    //             expect(currentLayout).toEqual(expectedLayout);
    //             expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
    //         }));
    //     });

    //     describe('updateCurrentLayout', () => {
    //         it('should publish HearingLayoutChanged across the event bus', fakeAsync(() => {
    //             // Arrange
    //             const conferenceId = Guid.create().toString();
    //             const layout = HearingLayout.OnePlus7;
    //             apiClientSpy.updateLayoutForHearing.and.returnValue(of(void 0));
    //             // Act
    //             service.updateCurrentLayout(layout);
    //             flush();

    //             // Assert
    //             expect(apiClientSpy.updateLayoutForHearing).toHaveBeenCalledOnceWith(conferenceId, layout);
    //         }));
    //     });

    //     describe('recommendLayout$', () => {
    //         describe('when participants list is updated', () => {
    //             it('should emit when the participants updated message is recieved', fakeAsync(() => {
    //                 // Arrange
    //                 const expectedLayout = HearingLayout.OnePlus7;
    //                 apiClientSpy.getRecommendedLayoutForHearing.and.returnValues(
    //                     of(HearingLayout.TwoPlus21),
    //                     of(HearingLayout.Dynamic),
    //                     of(HearingLayout.TwoPlus21),
    //                     of(expectedLayout)
    //                 );

    //                 flush();

    //                 // Act & Assert
    //                 let recommendedLayout = null;
    //                 service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));

    //                 expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

    //                 getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conference.id, []));
    //                 flush();
    //                 expect(recommendedLayout).toEqual(HearingLayout.Dynamic);

    //                 getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conference.id, []));
    //                 flush();
    //                 expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

    //                 getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conference.id, []));
    //                 flush();
    //                 expect(recommendedLayout).toEqual(expectedLayout);
    //             }));
    //         });
    //     });
    // });
});
