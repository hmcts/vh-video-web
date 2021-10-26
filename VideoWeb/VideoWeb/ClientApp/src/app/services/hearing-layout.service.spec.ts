import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, ReplaySubject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { ParticipantsUpdatedMessage } from '../shared/models/participants-updated-message';
import {
    eventHubReconnectSubjectMock,
    eventsServiceSpy,
    getParticipantsUpdatedSubjectMock,
    hearingLayoutChangedSubjectMock
} from '../testing/mocks/mock-events-service';
import { ApiClient, ConferenceResponse, HearingLayout } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { HearingLayoutService } from './hearing-layout.service';
import { Logger } from './logging/logger-base';
import { HearingLayoutChanged } from './models/hearing-layout-changed';

describe('HearingLayoutService', () => {
    let service: HearingLayoutService;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    const initialConferenceId = Guid.create().toString();
    let currentConferenceSubject: ReplaySubject<ConferenceResponse>;
    const initialConference = new ConferenceResponse({
        id: initialConferenceId
    });
    const initialLayout = HearingLayout.Dynamic;
    const initialRecommendedLayout = HearingLayout.Dynamic;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>([], ['currentConference$']);
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getLayoutForHearing', 'updateLayoutForHearing', 'getRecommendedLayoutForHearing']);

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
        apiClientSpy.getRecommendedLayoutForHearing.and.returnValue(of(initialRecommendedLayout));
        apiClientSpy.updateLayoutForHearing.and.returnValue(of(void 0));

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConferenceSubject.asObservable());
        service = new HearingLayoutService(
            jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']),
            conferenceServiceSpy,
            apiClientSpy,
            eventsServiceSpy
        );
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

            eventHubReconnectSubjectMock.next();
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
                apiClientSpy.updateLayoutForHearing.and.returnValue(of(void 0));
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
                expect(apiClientSpy.updateLayoutForHearing).toHaveBeenCalledOnceWith(conferenceId, layout);
            }));
        });

        describe('recommendLayout$', () => {
            describe('when participants list is updated', () => {
                it('should emit when the participants updated message is recieved', fakeAsync(() => {
                    // Arrange
                    const expectedLayout = HearingLayout.OnePlus7;
                    apiClientSpy.getRecommendedLayoutForHearing.and.returnValues(
                        of(HearingLayout.TwoPlus21),
                        of(HearingLayout.Dynamic),
                        of(HearingLayout.TwoPlus21),
                        of(expectedLayout)
                    );

                    const conferenceId = Guid.create().toString();
                    currentConferenceSubject.next(new ConferenceResponse({ id: conferenceId }));
                    flush();

                    // Act & Assert
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));

                    expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(HearingLayout.Dynamic);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(expectedLayout);
                }));

                it('should only emit when the update is for the current conference', fakeAsync(() => {
                    // Arrange
                    const expectedLayout = HearingLayout.OnePlus7;
                    apiClientSpy.getRecommendedLayoutForHearing.and.returnValues(of(HearingLayout.TwoPlus21), of(expectedLayout));

                    const conferenceId = Guid.create().toString();
                    currentConferenceSubject.next(new ConferenceResponse({ id: conferenceId }));
                    flush();

                    // Act & Assert
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));

                    expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(expectedLayout);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(Guid.create().toString(), []));
                    flush();
                    expect(recommendedLayout).toEqual(expectedLayout);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(Guid.create().toString(), []));
                    flush();
                    expect(recommendedLayout).toEqual(expectedLayout);
                }));

                it('should emit when the update is for the current conference even if the current conference changes', fakeAsync(() => {
                    // Arrange
                    const expectedLayout = HearingLayout.OnePlus7;
                    apiClientSpy.getRecommendedLayoutForHearing.and.returnValues(
                        of(HearingLayout.TwoPlus21),
                        of(HearingLayout.Dynamic),
                        of(HearingLayout.TwoPlus21),
                        of(expectedLayout)
                    );

                    const conferenceId = Guid.create().toString();
                    const otherConferenceId = Guid.create().toString();
                    currentConferenceSubject.next(new ConferenceResponse({ id: conferenceId }));
                    flush();

                    // Act & Assert
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));

                    expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(conferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(HearingLayout.Dynamic);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(otherConferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(HearingLayout.Dynamic);

                    currentConferenceSubject.next(new ConferenceResponse({ id: otherConferenceId }));
                    flush();
                    expect(recommendedLayout).toEqual(HearingLayout.TwoPlus21);

                    getParticipantsUpdatedSubjectMock.next(new ParticipantsUpdatedMessage(otherConferenceId, []));
                    flush();
                    expect(recommendedLayout).toEqual(expectedLayout);
                }));
            });

            describe('when conference changes', () => {
                it('should emit when the conference changes', fakeAsync(() => {
                    // Arrange
                    const expectedLayout = HearingLayout.OnePlus7;
                    apiClientSpy.getRecommendedLayoutForHearing.and.returnValues(
                        of(HearingLayout.TwoPlus21),
                        of(HearingLayout.Dynamic),
                        of(expectedLayout)
                    );

                    const conference1 = new ConferenceResponse({
                        id: Guid.create().toString()
                    });
                    const conference2 = new ConferenceResponse({
                        id: Guid.create().toString()
                    });
                    const conference3 = new ConferenceResponse({
                        id: Guid.create().toString()
                    });

                    currentConferenceSubject.next(conference1);
                    flush();

                    // Act
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));
                    flush();

                    currentConferenceSubject.next(conference2);
                    flush();

                    currentConferenceSubject.next(conference3);
                    flush();

                    // Assert
                    expect(recommendedLayout).toEqual(expectedLayout);
                }));

                it('should NOT emit again when the conference emits but does NOT change', fakeAsync(() => {
                    // Arrange
                    const conference = new ConferenceResponse({
                        id: Guid.create().toString()
                    });

                    apiClientSpy.getRecommendedLayoutForHearing.and.returnValue(of(HearingLayout.TwoPlus21));

                    currentConferenceSubject.next(conference);
                    flush();

                    // Act
                    let recommendedLayout = null;
                    service.recommendedLayout$.subscribe(layout => (recommendedLayout = layout));
                    flush();

                    recommendedLayout = null;
                    currentConferenceSubject.next(conference);
                    flush();

                    // Assert
                    expect(recommendedLayout).toBeNull();
                }));
            });
        });
    });
});
