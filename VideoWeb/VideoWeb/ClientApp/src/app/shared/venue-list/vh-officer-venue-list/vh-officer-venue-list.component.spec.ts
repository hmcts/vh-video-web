import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, ReplaySubject } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { CourtRoomsAccountResponse, HearingVenueResponse, JusticeUserResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../../vh-officer/services/models/session-keys';
import { VhOfficerVenueListComponent } from './vh-officer-venue-list.component';
import { By } from '@angular/platform-browser';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';
import { TranslatePipeMock } from '../../../testing/mocks/mock-translation-pipe';
import { ProfileService } from 'src/app/services/api/profile.service';

describe('VHOfficerVenueListComponent', () => {
    let component: VhOfficerVenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    const roomSessionStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);

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

    const cso1 = new JusticeUserResponse({ username: 'test-user1@hearings.reform.hmcts.net' });
    const cso2 = new JusticeUserResponse({ username: 'test-user2@hearings.reform.hmcts.net' });
    const csos: JusticeUserResponse[] = [];
    csos.push(cso1);
    csos.push(cso2);

    const selectedCsos = ['test-user-id1', 'test-user-id2'];

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getVenues',
            'getVenuesForAllocatedCSOs',
            'getCSOs'
        ]);
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
        component = new VhOfficerVenueListComponent(
            videoWebServiceSpy,
            router,
            vhoQueryService,
            logger,
            launchDarklyServiceSpy,
            profileServiceSpy
        );
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        videoWebServiceSpy.getVenuesForAllocatedCSOs.and.returnValue(of(venueNames.map(e => e.name)));
        videoWebServiceSpy.getCSOs.and.returnValue(of(csos));
        vhoQueryService.getCourtRoomsAccounts.and.returnValue(Promise.resolve(courtAccounts));
        launchDarklyServiceSpy.flagChange = new ReplaySubject();
        launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': true });
        venueSessionStorage.clear();
    });

    it('ngOnit should get csos and populate csos property for multi-select list', () => {
        component.csos = [];
        component.ngOnInit();
        expect(videoWebServiceSpy.getCSOs).toHaveBeenCalled();
        expect(component.csos[2]).toEqual(csos[0]);
        expect(component.csos[3]).toEqual(csos[1]);
    });

    it('should update storage with selection', () => {
        const selection = [venueNames[0].name];
        component.selectedVenues = selection;
        component.updateVenueSelection();
        const result = venueSessionStorage.get();
        expect(result.length).toBe(selection.length);
        expect(result[0]).toBe(venueNames[0].name);
    });

    it('should navigate to admin hearing list, with venues selected', fakeAsync(() => {
        component.selectedVenues = selectedJudgeNames;
        component.selectedCsos = [];
        component.goToHearingList();
        tick();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should navigate to admin hearing list, with allocated csos selected', fakeAsync(() => {
        component.selectedVenues = [];
        component.selectedCsos = selectedCsos;
        component.goToHearingList();
        tick();
        expect(videoWebServiceSpy.getVenuesForAllocatedCSOs).toHaveBeenCalledWith(selectedCsos, false);
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should attempt to navigate to admin hearing list but log and display error when no venues returned', fakeAsync(() => {
        component.selectedVenues = [];
        component.selectedCsos = selectedCsos;
        const loggerSpy = spyOn(logger, 'warn');
        videoWebServiceSpy.getVenuesForAllocatedCSOs.and.returnValue(of([]));
        component.goToHearingList();
        tick();
        expect(videoWebServiceSpy.getVenuesForAllocatedCSOs).toHaveBeenCalledWith(selectedCsos, false);
        expect(loggerSpy).toHaveBeenCalled();
        expect(component.errorMessage).toBe('Failed to find venues');
    }));

    it('should  create filter records with all options are selected and store in storage', fakeAsync(() => {
        component.selectedVenues = selectedJudgeNames;
        component.goToHearingList();
        tick();
        expect(component.filterCourtRoomsAccounts.length).toBe(2);
        const result = roomSessionStorage.get();
        expect(result.length).toBe(2);
        expect(result[0].venue).toBe(courtRoomsAccounts1.first_name);
        expect(result[0].selected).toBeTrue();
        expect(result[0].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[0].courtsRooms[0].selected).toBeTrue();
        expect(result[0].courtsRooms[1].selected).toBeTrue();

        expect(result[1].venue).toBe(courtRoomsAccounts2.first_name);
        expect(result[1].selected).toBeTrue();
        expect(result[1].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[1].courtsRooms[0].selected).toBeTrue();
        expect(result[1].courtsRooms[1].selected).toBeTrue();
    }));
    it('should update filter records with select options from filter in storage', fakeAsync(() => {
        const currentStorage = roomSessionStorage.get();
        component.selectedVenues = selectedJudgeNames;
        venueAccounts[0].courtsRooms[0].selected = false;
        venueAccounts[1].courtsRooms[0].selected = false;

        roomSessionStorage.set(venueAccounts);

        component.goToHearingList();
        tick();
        expect(component.filterCourtRoomsAccounts.length).toBe(2);
        const result = roomSessionStorage.get();
        expect(result.length).toBe(2);
        expect(result[0].venue).toBe(courtRoomsAccounts1.first_name);
        expect(result[0].selected).toBeFalse();
        expect(result[0].courtsRooms[0].selected).toBeFalse();
        expect(result[0].courtsRooms[1].selected).toBeTrue();

        expect(result[1].selected).toBeFalse();
        expect(result[1].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[1].courtsRooms[0].selected).toBeFalse();
        expect(result[1].courtsRooms[1].selected).toBeTrue();
        roomSessionStorage.set(currentStorage);
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

        it('Should not show cso list, when implemented by vh-officer-venue-list and feature flag off', () => {
            launchDarklyServiceSpy.flagChange.next({ 'vho-work-allocation': false });
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('#cso-list'))).toBeFalsy();
        });
    });
});
