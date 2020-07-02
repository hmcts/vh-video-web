import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhoStorageKeys } from '../services/models/session-keys';
import { VenueListComponent } from './venue-list.component';
import { JudgeNameListResponse, CourtRoomsAccountResponse } from 'src/app/services/clients/api-client';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';
import { fakeAsync, tick } from '@angular/core/testing';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

describe('VenueListComponent', () => {
    let component: VenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    const roomSessionStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);

    const judges = new JudgeNameListResponse();
    const judgeNames: string[] = [];
    judgeNames.push('Birmingham');
    judgeNames.push('Manchester');
    judgeNames.push('Taylor House');
    judges.first_names = judgeNames;

    const courtRoomsAccounts1 = new CourtRoomsAccountResponse({ venue: 'Birmingham', court_rooms: ['Room 01', 'Room 02'] });
    const courtRoomsAccounts2 = new CourtRoomsAccountResponse({ venue: 'Manchester', court_rooms: ['Room 01', 'Room 02'] });
    const courtAccounts: CourtRoomsAccountResponse[] = [];
    courtAccounts.push(courtRoomsAccounts1);
    courtAccounts.push(courtRoomsAccounts2);

    const venueAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], false);
    const venueAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], false);
    const venueAccounts: CourtRoomsAccounts[] = [];
    venueAccounts.push(venueAccounts1);
    venueAccounts.push(venueAccounts2);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getDistinctJudgeNames']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getCourtRoomsAccounts']);
    });

    beforeEach(() => {
        component = new VenueListComponent(videoWebServiceSpy, router, vhoQueryService, logger);
        videoWebServiceSpy.getDistinctJudgeNames.and.returnValue(Promise.resolve(judges));
        vhoQueryService.getCourtRoomsAccounts.and.returnValue(Promise.resolve(courtAccounts));
        venueSessionStorage.clear();
    });

    it('should retrieve and populate venues on init', async () => {
        expect(component.judges).toBeUndefined();
        await component.ngOnInit();
        expect(component.judges).toBeDefined();
    });

    it('should update storage with selection', () => {
        const selection = [judges.first_names[0]];
        component.selectedJudges = selection;
        component.updateSelection();
        const result = venueSessionStorage.get();
        expect(result.length).toBe(selection.length);
        expect(result[0]).toBe(judges.first_names[0]);
    });

    it('should navigate to admin hearing list', fakeAsync( () => {
        component.goToHearingList();
        tick();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    }));

    it('should return false when no allocations are selected', () => {
        component.selectedJudges = [];
        expect(component.venuesSelected).toBeFalsy();
    });

    it('should return true when allocations are selected', () => {
        component.selectedJudges = [judges[0]];
        expect(component.venuesSelected).toBeTruthy();
    });
    it('should  create filter records with all options are selected and store in storage', fakeAsync(() => {
        component.selectedJudges = judgeNames;
        component.goToHearingList();
        tick();
        expect(component.filterCourtRoomsAccounts.length).toBe(2);
        const result = roomSessionStorage.get();
        expect(result.length).toBe(2);
        expect(result[0].venue).toBe(courtRoomsAccounts1.venue);
        expect(result[0].selected).toBeTrue();
        expect(result[0].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[0].courtsRooms[0].selected).toBeTrue();
        expect(result[0].courtsRooms[1].selected).toBeTrue();

        expect(result[1].venue).toBe(courtRoomsAccounts2.venue);
        expect(result[1].selected).toBeTrue();
        expect(result[1].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[1].courtsRooms[0].selected).toBeTrue();
        expect(result[1].courtsRooms[1].selected).toBeTrue();
    }));
    it('should update filter records with select options from filter in storage', fakeAsync(() => {
        component.selectedJudges = judgeNames;
        venueAccounts[0].courtsRooms[0].selected = false;
        venueAccounts[1].courtsRooms[0].selected = false;

        roomSessionStorage.set(venueAccounts);

        component.goToHearingList();
        tick();
        expect(component.filterCourtRoomsAccounts.length).toBe(2);
        const result = roomSessionStorage.get();
        expect(result.length).toBe(2);
        expect(result[0].venue).toBe(courtRoomsAccounts1.venue);
        expect(result[0].selected).toBeFalse();
        expect(result[0].courtsRooms[0].selected).toBeFalse();
        expect(result[0].courtsRooms[1].selected).toBeTrue();

        expect(result[1].selected).toBeFalse();
        expect(result[1].courtsRooms[0].courtRoom).toBe('Room 01');
        expect(result[1].courtsRooms[0].selected).toBeFalse();
        expect(result[1].courtsRooms[1].selected).toBeTrue();
    }));
    it('should not get court rooms accounts if no venues selected', fakeAsync(() => {
        component.selectedJudges = null;
        spyOn(logger, 'warn');
        component.goToHearingList();
        tick();
        expect(logger.warn).toHaveBeenCalled();
    }));
});
