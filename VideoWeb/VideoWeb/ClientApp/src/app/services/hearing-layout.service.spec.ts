import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { eventsServiceSpy, hearingLayoutChangedSubjectMock } from '../testing/mocks/mock-events-service';
import { ApiClient, ConferenceResponse, HearingLayout } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { HearingLayoutService } from './hearing-layout.service';
import { Logger } from './logging/logger-base';
import HearingLayoutChanged from './models/hearing-layout-chagned';

fdescribe('HearingLayoutService', () => {
    let service: HearingLayoutService;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>([], ['currentConference$']);
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getLayoutForHearing']);

        TestBed.configureTestingModule({
            providers: [
                { provide: Logger, useValue: jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']) },
                { provide: ConferenceService, useValue: conferenceServiceSpy },
                { provide: ApiClient, useValue: apiClientSpy },
                { provide: EventsService, useValue: eventsServiceSpy }
            ]
        });
        service = TestBed.inject(HearingLayoutService);
    });

    describe('on initialisation', () => {
        it('should attempt to get the current layout', fakeAsync(() => {
            // Arrange
            const conferenceId = Guid.create().toString();
            const expectedLayout = HearingLayout.OnePlus7;
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(
                of(
                    new ConferenceResponse({
                        id: conferenceId
                    })
                )
            );

            apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

            // Act
            var currentLayout: HearingLayout | null = null;
            service.ngOnInit();
            service.currentLayout$.subscribe(layout => (currentLayout = layout));
            flush();

            // Assert
            expect(currentLayout).toBeTruthy();
            expect(currentLayout).toEqual(expectedLayout);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(conferenceId);
        }));
    });

    describe('on hearingLayoutChanged recieved on event bus', () => {
        const conferenceId = Guid.create().toString();
        const initialLayout = HearingLayout.Dynamic;

        beforeEach(fakeAsync(() => {
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(
                of(
                    new ConferenceResponse({
                        id: conferenceId
                    })
                )
            );

            apiClientSpy.getLayoutForHearing.and.returnValue(of(initialLayout));

            service.ngOnInit();
            flush();
        }));

        it('should emit the new layout from currentLayout$ when it is for the current conference', fakeAsync(() => {
            // Arrange
            const expectedLayout = HearingLayout.OnePlus7;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(
                of(
                    new ConferenceResponse({
                        id: conferenceId
                    })
                )
            );

            apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

            // Act
            hearingLayoutChangedSubjectMock.next(new HearingLayoutChanged(conferenceId, expectedLayout));
            flush();

            var currentLayout: HearingLayout | null = null;
            service.currentLayout$.subscribe(layout => (currentLayout = layout));

            // Assert
            expect(currentLayout).toEqual(expectedLayout);
        }));
    });

    describe('getCurrentLayout', () => {
        it('should get the current conference id and retrive the layout for it', fakeAsync(() => {
            // Arrange
            const conferenceId = Guid.create().toString();
            const expectedLayout = HearingLayout.OnePlus7;
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(
                of(
                    new ConferenceResponse({
                        id: conferenceId
                    })
                )
            );

            apiClientSpy.getLayoutForHearing.and.returnValue(of(expectedLayout));

            // Act
            var currentLayout: HearingLayout | null = null;
            service.getCurrentLayout().subscribe(layout => (currentLayout = layout));
            flush();

            // Assert
            expect(currentLayout).toEqual(expectedLayout);
            expect(apiClientSpy.getLayoutForHearing).toHaveBeenCalledOnceWith(conferenceId);
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
});
