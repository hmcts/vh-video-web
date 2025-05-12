import { Router } from '@angular/router';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../../vh-officer/services/models/session-keys';
import { pageUrls } from '../../page-url.constants';
import { StaffMemberVenueListComponent } from './staff-member-venue-list.component';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../../services/launch-darkly.service';
import { TranslatePipeMock } from '../../../testing/mocks/mock-translation-pipe';
import { ProfileService } from 'src/app/services/api/profile.service';
import { TranslateService } from '@ngx-translate/core';

describe('StaffMemerVenueListComponent', () => {
    let component: StaffMemberVenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);

    const venueNames: HearingVenueResponse[] = [];
    const venueName1 = new HearingVenueResponse({ id: 1, name: 'Birmingham' });
    const venueName2 = new HearingVenueResponse({ id: 2, name: 'Manchester' });
    const venueName3 = new HearingVenueResponse({ id: 3, name: 'Taylor House' });
    venueNames.push(venueName1);
    venueNames.push(venueName2);
    venueNames.push(venueName3);

    const selectedJudgeNames: string[] = [];
    selectedJudgeNames.push(venueName1.name);
    selectedJudgeNames.push(venueName2.name);
    selectedJudgeNames.push(venueName3.name);

    const venueAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], false);
    const venueAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], false);
    const venueAccounts: CourtRoomsAccounts[] = [];
    venueAccounts.push(venueAccounts1);
    venueAccounts.push(venueAccounts2);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getVenues']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new StaffMemberVenueListComponent(
            videoWebServiceSpy,
            router,
            vhoQueryService,
            logger,
            launchDarklyServiceSpy,
            profileServiceSpy,
            translateServiceSpy
        );
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.activeSessionFilter, jasmine.any(Boolean)).and.returnValue(of(true));
        venueSessionStorage.clear();
    });

    it('should navigate to staff member hearing list', () => {
        component.goToHearingList();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.StaffMemberHearingList);
    });

    describe('component rendering', () => {
        it('Should not show cso list, when implemented by staff-member-venue-list and feature flag on', () => {
            TestBed.configureTestingModule({
                declarations: [StaffMemberVenueListComponent, TranslatePipeMock],
                providers: [
                    { provide: VideoWebService, useValue: videoWebServiceSpy },
                    { provide: Router, useValue: router },
                    { provide: VhoQueryService, useValue: vhoQueryService },
                    { provide: Logger, useValue: logger },
                    { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                    { provide: TranslateService, useValue: translateServiceSpy },
                    { provide: ProfileService, useValue: profileServiceSpy }
                ]
            });
            const fixture = TestBed.createComponent(StaffMemberVenueListComponent);
            expect(fixture.debugElement.query(By.css('#cso-list'))).toBeFalsy();
        });
    });
});
