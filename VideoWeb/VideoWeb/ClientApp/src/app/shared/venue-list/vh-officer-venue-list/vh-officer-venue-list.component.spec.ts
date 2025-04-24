import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse, JusticeUserResponse, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../../vh-officer/services/models/session-keys';
import { VhOfficerVenueListComponent } from './vh-officer-venue-list.component';
import { By } from '@angular/platform-browser';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../../services/launch-darkly.service';
import { TranslatePipeMock } from '../../../testing/mocks/mock-translation-pipe';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VenueListComponentDirective } from '../venue-list.component';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { TranslateService } from '@ngx-translate/core';

describe('VHOfficerVenueListComponent', () => {
    let component: VhOfficerVenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    const roomSessionStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
    const csoSessionStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);

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

    const loggedInUser = new UserProfileResponse({ username: 'test-user1@hearings.reform.hmcts.net', roles: [Role.VideoHearingsOfficer] });
    const cso1 = new JusticeUserResponse({ username: loggedInUser.username, id: 'test-user-1' });
    const cso2 = new JusticeUserResponse({ username: 'test-user2@hearings.reform.hmcts.net', id: 'test-user-2' });
    const csos: JusticeUserResponse[] = [];
    csos.push(cso1);
    csos.push(cso2);
    const csoAllocatedToMe = new JusticeUserResponse({
        id: VenueListComponentDirective.ALLOCATED_TO_ME,
        first_name: 'Allocated to me',
        full_name: 'Allocated to me'
    });
    const csoUnallocated = new JusticeUserResponse({
        id: VenueListComponentDirective.UNALLOCATED,
        first_name: 'Unallocated',
        full_name: 'Unallocated'
    });

    const selectedCsos = ['test-user-id1', 'test-user-id2'];

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getVenues', 'getCSOs']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getActiveConferences']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new VhOfficerVenueListComponent(
            videoWebServiceSpy,
            router,
            vhoQueryService,
            logger,
            launchDarklyServiceSpy,
            profileServiceSpy,
            translateServiceSpy
        );
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        videoWebServiceSpy.getCSOs.and.returnValue(of(csos));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.activeSessionFilter, jasmine.any(Boolean)).and.returnValue(of(true));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(loggedInUser));
        venueSessionStorage.clear();
        csoSessionStorage.clear();
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            component.csos = [];
        });

        it('should get csos and populate csos property for multi-select list', fakeAsync(() => {
            component.ngOnInit();
            tick();
            expect(videoWebServiceSpy.getCSOs).toHaveBeenCalled();
            expect(component.csos[0]).toEqual(csoAllocatedToMe);
            expect(component.csos[1]).toEqual(csoUnallocated);
            expect(component.csos[2]).toEqual(csos[0]);
            expect(component.csos[3]).toEqual(csos[1]);
        }));

        it('should re-apply previous filter when it exists, with unallocated hearings included', fakeAsync(() => {
            component.ngOnInit();
            tick();
            const testSelectedCsos = [cso2.id, csoAllocatedToMe.id, csoUnallocated.id];
            component.selectedCsos = [...testSelectedCsos];
            component.updateCsoSelection();
            tick();
            component.selectedCsos = [];
            component.ngOnInit();
            tick();
            expect(component.selectedCsos).toEqual(testSelectedCsos);
        }));

        it('should re-apply previous filter when it exists, with unallocated hearings excluded', fakeAsync(() => {
            component.ngOnInit();
            tick();
            const testSelectedCsos = [cso2.id, csoAllocatedToMe.id];
            component.selectedCsos = [...testSelectedCsos];
            component.updateCsoSelection();
            tick();
            component.selectedCsos = [];
            component.ngOnInit();
            tick();
            expect(component.selectedCsos).toEqual(testSelectedCsos);
        }));

        it('should re-apply previous filter when it exists and ignore case of username', fakeAsync(() => {
            component.ngOnInit();
            tick();
            const testSelectedCsos = [cso2.id, csoAllocatedToMe.id];
            component.selectedCsos = [...testSelectedCsos];
            const user = { ...loggedInUser } as UserProfileResponse;
            user.username = loggedInUser.username.toUpperCase();
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(user));
            component.updateCsoSelection();
            tick();
            component.selectedCsos = [];
            component.ngOnInit();
            tick();
            expect(component.selectedCsos).toEqual(testSelectedCsos);
        }));

        it('should not add allocated to me option if logged in user is not in cso list', fakeAsync(() => {
            const user = { ...loggedInUser } as UserProfileResponse;
            user.username = 'doesnotexist@email.com';
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(user));
            component.ngOnInit();
            tick();
            expect(component.csos.length).toBe(3);
            expect(component.csos[0]).toEqual(csoUnallocated);
            expect(component.csos[1]).toEqual(csos[0]);
            expect(component.csos[2]).toEqual(csos[1]);
        }));

        it('should not re-select allocated to me if logged in user is no longer in cso list', fakeAsync(() => {
            component.ngOnInit();
            tick();
            const testSelectedCsos = [cso2.id, csoAllocatedToMe.id];
            component.selectedCsos = [...testSelectedCsos];
            component.updateCsoSelection();
            tick();
            const updatedCsos = [...component.csos];
            const loggedInUserToRemove = component.csos.find(c => c.username === loggedInUser.username);
            updatedCsos.splice(component.csos.indexOf(loggedInUserToRemove), 1);
            videoWebServiceSpy.getCSOs.and.returnValue(of(updatedCsos));
            component.selectedCsos = [];
            component.ngOnInit();
            tick();
            expect(component.selectedCsos.length).toBe(1);
            expect(component.selectedCsos).toEqual([cso2.id]);
        }));
    });

    it('should update storage with selection', () => {
        const selection = [venueNames[0].name];
        component.selectedVenues = selection;
        component.updateVenueSelection();
        const result = venueSessionStorage.get();
        expect(result.length).toBe(selection.length);
        expect(result[0]).toBe(venueNames[0].name);
    });

    it('should navigate to admin hearing with list active sessions', fakeAsync(() => {
        component.activeSessions = true;
        component.goToHearingList();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should navigate to admin hearing list, with venues selected', fakeAsync(() => {
        component.selectedVenues = selectedJudgeNames;
        component.selectedCsos = [];
        component.goToHearingList();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should navigate to admin hearing list, with allocated csos selected', fakeAsync(() => {
        component.selectedVenues = [];
        component.selectedCsos = selectedCsos;
        component.goToHearingList();
        tick();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should attempt to navigate to admin hearing list but log and display error when no venues returned', fakeAsync(() => {
        component.selectedVenues = [];
        component.selectedCsos = [];
        const loggerSpy = spyOn(logger, 'warn');
        component.goToHearingList();
        tick();
        expect(loggerSpy).toHaveBeenCalled();
        expect(component.errorMessage).toBe('Please select a filter to view hearings');
    }));

    it('should not get court rooms accounts if no venues selected', fakeAsync(() => {
        component.selectedVenues = null;
        spyOn(logger, 'warn');
        component.goToHearingList();
        tick();
        expect(logger.warn).toHaveBeenCalled();
    }));

    describe('component rendering', () => {
        let fixture: ComponentFixture<VhOfficerVenueListComponent>;
        let fixtureComponent: VhOfficerVenueListComponent;
        beforeEach(() => {
            TestBed.configureTestingModule({
                declarations: [VhOfficerVenueListComponent, TranslatePipeMock],
                providers: [
                    { provide: VideoWebService, useValue: videoWebServiceSpy },
                    { provide: Router, useValue: router },
                    { provide: VhoQueryService, useValue: vhoQueryService },
                    { provide: Logger, useValue: logger },
                    { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                    { provide: ProfileService, useValue: profileServiceSpy }
                ]
            });
            fixture = TestBed.createComponent(VhOfficerVenueListComponent);
            fixtureComponent = fixture.componentInstance;
        });

        it('Should show cso list, when implemented by vh-officer-venue-list', () => {
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('#cso-list'))).toBeTruthy();
        });
    });
});
