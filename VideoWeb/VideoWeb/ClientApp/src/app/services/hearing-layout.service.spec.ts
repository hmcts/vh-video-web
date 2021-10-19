import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, ReplaySubject, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { eventsServiceSpy, hearingLayoutChangedSubjectMock } from '../testing/mocks/mock-events-service';
import { ApiClient, ConferenceResponse, HearingLayout, ParticipantResponse, VideoEndpointResponse } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { HearingLayoutService } from './hearing-layout.service';
import { Logger } from './logging/logger-base';
import HearingLayoutChanged from './models/hearing-layout-chagned';

describe('HearingLayoutService', () => {
    let service: HearingLayoutService;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    let getServiceConnectedSubject: Subject<void>;

    const initialConferenceId = Guid.create().toString();
    let currentConferenceSubject: ReplaySubject<ConferenceResponse>;
    const initialConference = new ConferenceResponse({
        id: initialConferenceId
    });
    const initialLayout = HearingLayout.Dynamic;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>([], ['currentConference$']);
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getLayoutForHearing']);

        getServiceConnectedSubject = new Subject<void>();
        eventsServiceSpy.getServiceConnected.and.returnValue(getServiceConnectedSubject.asObservable());

        TestBed.configureTestingModule({
            providers: [
                { provide: Logger, useValue: jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']) },
                { provide: ConferenceService, useValue: conferenceServiceSpy },
                { provide: ApiClient, useValue: apiClientSpy },
                { provide: EventsService, useValue: eventsServiceSpy }
            ]
        });

        currentConferenceSubject = new ReplaySubject<ConferenceResponse>(1);
        currentConferenceSubject.next(initialConference);

        apiClientSpy.getLayoutForHearing.and.returnValue(of(initialLayout));
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConferenceSubject.asObservable());
        service = TestBed.inject(HearingLayoutService);
    });

    describe('on initialisation', () => {
        it('should of fetched the current layout', fakeAsync(() => {
            // Act
            let currentLayout: HearingLayout | null = null;
            service.currentLayout$.subscribe(layout => {
                currentLayout = layout;
            });
            flush();

            // Assert
            expect(currentLayout).toBeTruthy();
            expect(currentLayout).toEqual(initialLayout);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
        }));
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

            getServiceConnectedSubject.next();
            flush();
            flush();

            // Assert
            expect(currentLayout).toBeTruthy();
            expect(currentLayout).toEqual(expectedLayout);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
        }));
    });

    describe('after initialisation', () => {
        describe('on hearingLayoutChanged recieved on event bus', () => {
            it('should emit the new layout from currentLayout$ when it is for the current conference', fakeAsync(() => {
                // Arrange
                const expectedLayout = HearingLayout.OnePlus7;
                const changedById = Guid.create().toString();
                apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

                // Act
                hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(initialConferenceId, changedById, expectedLayout));
                flush();

                let currentLayout: HearingLayout | null = null;
                service.currentLayout$.subscribe(layout => (currentLayout = layout));

                // Assert
                expect(currentLayout).toEqual(expectedLayout);
            }));

            it('should NOT emit the new layout from currentLayout$ when it is NOT for the current conference', fakeAsync(() => {
                // Arrange
                const unexpectedLayout = HearingLayout.OnePlus7;

                // Act
                hearingLayoutChangedSubjectMock.next(
                    new HearingLayoutChanged(Guid.create().toString(), Guid.create().toString(), unexpectedLayout)
                );
                flush();

                let currentLayout: HearingLayout | null = null;
                service.currentLayout$.subscribe(layout => (currentLayout = layout));

                // Assert
                expect(currentLayout).toEqual(initialLayout);
            }));

            it('should filter for the new conference when the conference changes and NOT emit the new layout from currentLayout$ when it is NOT for the new conference', fakeAsync(() => {
                // Arrange
                const unexpectedLayout = HearingLayout.TwoPlus21;

                const conferenceId = Guid.create().toString();
                const changedById = Guid.create().toString();
                const conference = new ConferenceResponse({ id: conferenceId });

                // Act
                currentConferenceSubject.next(conference);
                flush();

                hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(initialConferenceId, changedById, unexpectedLayout));
                flush();

                let currentLayout: HearingLayout | null = null;
                service.currentLayout$.subscribe(layout => (currentLayout = layout));

                // Assert
                expect(currentLayout).toEqual(initialLayout);
            }));

            it('should filter for the new conference when the conference changes and emit the new layout from currentLayout$ when it is for the new conference', fakeAsync(() => {
                // Arrange
                const expectedLayout = HearingLayout.TwoPlus21;

                const conferenceId = Guid.create().toString();
                const changedById = Guid.create().toString();
                const conference = new ConferenceResponse({ id: conferenceId });

                // Act
                currentConferenceSubject.next(conference);
                flush();

                hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(conferenceId, changedById, expectedLayout));
                flush();

                let currentLayout: HearingLayout | null = null;
                service.currentLayout$.subscribe(layout => (currentLayout = layout));

                // Assert
                expect(currentLayout).toEqual(expectedLayout);
            }));
        });

        describe('getCurrentLayout', () => {
            beforeEach(() => {
                apiClientSpy.getLayoutForHearing.calls.reset();
            });

            it('should get the current conference id and retrive the layout for it', fakeAsync(() => {
                // Arrange
                const expectedLayout = HearingLayout.OnePlus7;

                apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

                // Act
                let currentLayout: HearingLayout | null = null;
                service.getCurrentLayout().subscribe(layout => (currentLayout = layout));
                flush();

                // Assert
                expect(currentLayout).toEqual(expectedLayout);
                expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(initialConferenceId);
            }));
        });

        describe('updateCurrentLayout', () => {
            it('should publish HearingLayoutChanged across the event bus', fakeAsync(() => {
                // Arrange
                const conferenceId = Guid.create().toString();
                const layout = HearingLayout.OnePlus7;
                getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(
                    of(
                        new ConferenceResponse({
                            id: conferenceId
                        })
                    )
                );

                // Act
                service.updateCurrentLayout(layout);
                flush();

                // Assert
                expect(eventsServiceSpy.updateHearingLayout).toHaveBeenCalledOnceWith(conferenceId, layout);
            }));
        });

        describe('recommendLayout$', () => {
            const dynamicConferenceMin = new ConferenceResponse();
            dynamicConferenceMin.id = Guid.create().toString();
            dynamicConferenceMin.participants = [];
            dynamicConferenceMin.endpoints = [];

            const dynamicConferenceMax = new ConferenceResponse();
            dynamicConferenceMax.id = Guid.create().toString();
            dynamicConferenceMax.participants = [{} as ParticipantResponse, {} as ParticipantResponse, {} as ParticipantResponse];
            dynamicConferenceMax.endpoints = [{} as VideoEndpointResponse, {} as VideoEndpointResponse];

            const onePlusSevenConferenceMin = new ConferenceResponse();
            onePlusSevenConferenceMin.id = Guid.create().toString();
            onePlusSevenConferenceMin.participants = [
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse
            ];
            onePlusSevenConferenceMin.endpoints = [{} as VideoEndpointResponse, {} as VideoEndpointResponse];

            const onePlusSevenConferenceMax = new ConferenceResponse();
            onePlusSevenConferenceMax.id = Guid.create().toString();
            onePlusSevenConferenceMax.participants = [
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse
            ];
            onePlusSevenConferenceMax.endpoints = [
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse
            ];

            const twoPlusTwentyOneConferenceMin = new ConferenceResponse();
            twoPlusTwentyOneConferenceMin.id = Guid.create().toString();
            twoPlusTwentyOneConferenceMin.participants = [
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse,
                {} as ParticipantResponse
            ];
            twoPlusTwentyOneConferenceMin.endpoints = [
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse,
                {} as VideoEndpointResponse
            ];

            const testCases = [
                { conference: dynamicConferenceMin, expectedLayout: HearingLayout.Dynamic },
                { conference: dynamicConferenceMax, expectedLayout: HearingLayout.Dynamic },
                { conference: onePlusSevenConferenceMin, expectedLayout: HearingLayout.OnePlus7 },
                { conference: onePlusSevenConferenceMax, expectedLayout: HearingLayout.OnePlus7 },
                { conference: twoPlusTwentyOneConferenceMin, expectedLayout: HearingLayout.TwoPlus21 }
            ];

            testCases.forEach(testCase => {
                it(`should recommend ${testCase.expectedLayout} for ${
                    testCase.conference.participants.length + testCase.conference.endpoints.length
                } participants.`, fakeAsync(() => {
                    // Arrange
                    currentConferenceSubject.next(testCase.conference);
                    flush();

                    // Act
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));
                    flush();

                    // Assert
                    expect(recommendedLayout).toEqual(testCase.expectedLayout);
                }));
            });

            it('should emit again when the conference changes', fakeAsync(() => {
                // Arrange
                currentConferenceSubject.next(dynamicConferenceMin);
                flush();

                // Act
                let recommendedLayout = null;
                service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));
                flush();

                currentConferenceSubject.next(twoPlusTwentyOneConferenceMin);
                flush();

                currentConferenceSubject.next(onePlusSevenConferenceMin);
                flush();

                // Assert
                expect(recommendedLayout).toEqual(HearingLayout.OnePlus7);
            }));

            it('should NOT emit again when the conference emits but does NOT change', fakeAsync(() => {
                // Arrange
                currentConferenceSubject.next(dynamicConferenceMin);
                flush();

                // Act
                let recommendedLayout = null;
                service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));
                flush();

                recommendedLayout = null;
                currentConferenceSubject.next(dynamicConferenceMin);
                flush();

                // Assert
                expect(recommendedLayout).toBeNull();
            }));
        });
    });
});
