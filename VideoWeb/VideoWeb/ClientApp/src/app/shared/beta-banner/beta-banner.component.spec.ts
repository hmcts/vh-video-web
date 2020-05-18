import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { BetaBannerComponent } from './beta-banner.component';

@Component({ selector: 'app-mock-component', template: '' })
class Mock1Component {}

@Component({ selector: 'app-mock-component2', template: '' })
class Mock2Component {}

const routes = [
    { path: 'sub-component1', component: Mock1Component },
    { path: 'sub-component2', component: Mock2Component }
];

describe('BetaBannerComponent', () => {
    let component: BetaBannerComponent;
    let fixture: ComponentFixture<BetaBannerComponent>;
    let router: Router;
    let adalService: MockAdalService;
    let eventService: MockEventsService;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
    const profile = new UserProfileResponse({ role: Role.Representative });
    profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(Promise.resolve(conference));

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [BetaBannerComponent, Mock1Component, Mock2Component],
            imports: [RouterTestingModule.withRoutes(routes)],
            providers: [
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: Logger, useClass: MockLogger },
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: AdalService, useClass: MockAdalService },
                { provide: EventsService, useClass: MockEventsService }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
        router = TestBed.get(Router);
        fixture = TestBed.createComponent(BetaBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('navigate to sub-component1 should see sub-component1 in router url', fakeAsync(() => {
        fixture.ngZone.run(() => {
            router.navigate(['sub-component1']);
            tick();
            expect(router.url).toBe('/sub-component1');
            expect(component.pageUrl).toBe('https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/?pageurl=/sub-component1');
        });
    }));
});
