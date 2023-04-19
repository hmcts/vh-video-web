import { Router } from '@angular/router';
import { of, ReplaySubject } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    CourtRoomsAccountResponse,
    HearingVenueResponse,
    JusticeUserResponse,
    UserProfileResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { VenueListComponentDirective } from './venue-list.component';
import { LaunchDarklyService } from '../../services/launch-darkly.service';
import { ProfileService } from 'src/app/services/api/profile.service';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { fakeAsync, tick } from '@angular/core/testing';

class MockedVenueListComponent extends VenueListComponentDirective {
    get showVhoSpecificContent() {
        return true;
    }

    goToHearingList() {}
}

describe('VenueListComponent', () => {
    let component: VenueListComponentDirective;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    const logger: Logger = new MockLogger();
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
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

    const courtRoomsAccounts1 = new CourtRoomsAccountResponse({ first_name: 'Birmingham', last_names: ['Room 01', 'Room 02'] });
    const courtRoomsAccounts2 = new CourtRoomsAccountResponse({ first_name: 'Manchester', last_names: ['Room 01', 'Room 02'] });
    const courtAccounts: CourtRoomsAccountResponse[] = [];
    courtAccounts.push(courtRoomsAccounts1);
    courtAccounts.push(courtRoomsAccounts2);

    const venueAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], false);
    const venueAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], false);
    const venueAccounts: CourtRoomsAccounts[] = [];
    venueAccounts.push(venueAccounts1);
    venueAccounts.push(venueAccounts2);

    const loggedInUser = new UserProfileResponse({ username: 'loggedIn@email.com' });
    const csos: JusticeUserResponse[] = [];
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
    const cso1 = new JusticeUserResponse({
        id: '123',
        first_name: 'Test',
        full_name: 'Cso',
        username: loggedInUser.username
    });
    csos.push(csoAllocatedToMe);
    csos.push(csoUnallocated);
    csos.push(cso1);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getVenues']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getCourtRoomsAccounts']);
        launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['flagChange']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new MockedVenueListComponent(
            videoWebServiceSpy,
            router,
            vhoQueryService,
            logger,
            launchDarklyServiceSpy,
            profileServiceSpy
        );
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        vhoQueryService.getCourtRoomsAccounts.and.returnValue(Promise.resolve(courtAccounts));
        launchDarklyServiceSpy.flagChange = new ReplaySubject();
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true });
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(loggedInUser));
        component.csos = csos;
        venueSessionStorage.clear();
        csoSessionStorage.clear();
    });

    it('should retrieve and populate venues on init', () => {
        expect(component.venues).toBeUndefined();
        component.ngOnInit();
        expect(component.venues).toBeDefined();
    });

    it('should return false when no allocations are selected', () => {
        component.selectedVenues = [];
        expect(component.venuesSelected).toBeFalsy();
    });

    it('should return true when allocations are selected', () => {
        component.selectedVenues = [venueNames[0].name];
        expect(component.venuesSelected).toBeTruthy();
    });

    describe('updateCsoSelection', () => {
        it('should update storage with selection', fakeAsync(() => {
            component.selectedVenues = [venueNames[0].name];
            component.updateVenueSelection();
            component.selectedCsos = [csoAllocatedToMe.id, csoUnallocated.id, cso1.id];
            component.updateCsoSelection();
            tick();

            expect(component.selectedVenues.length).toBe(0);
            const venueAllocation = venueSessionStorage.get();
            expect(venueAllocation).toBeNull();
            const csoFilter = csoSessionStorage.get();
            expect(csoFilter).not.toBeNull();
            expect(csoFilter.allocatedCsoIds.length).toBe(1);
            expect(csoFilter.allocatedCsoIds).toEqual([cso1.id]);
            expect(csoFilter.includeUnallocated).toBeTrue();
        }));

        it('should ignore case of username when looking up the user', fakeAsync(() => {
            const user = { ...loggedInUser } as UserProfileResponse;
            user.username = loggedInUser.username.toUpperCase();
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(user));
            component.selectedCsos = [csoAllocatedToMe.id];
            component.updateCsoSelection();
            tick();

            const csoFilter = csoSessionStorage.get();
            expect(csoFilter.allocatedCsoIds.length).toBe(1);
            expect(csoFilter.allocatedCsoIds).toEqual([cso1.id]);
        }));
    });
});
