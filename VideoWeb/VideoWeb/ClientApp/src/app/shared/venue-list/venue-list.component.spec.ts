import { Router } from '@angular/router';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { CourtRoomsAccountResponse, HearingVenueResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { VenueListComponentDirective } from './venue-list.component';

class MockedVenueListComponent extends VenueListComponentDirective {
    goToHearingList() {}

    get showVhoSpecificContent(): boolean {
        return false;
    }
}

describe('VenueListComponent', () => {
    let component: VenueListComponentDirective;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const logger: Logger = new MockLogger();

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

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getVenues']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getCourtRoomsAccounts']);
    });

    beforeEach(() => {
        component = new MockedVenueListComponent(videoWebServiceSpy, router, vhoQueryService, logger);
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        vhoQueryService.getCourtRoomsAccounts.and.returnValue(Promise.resolve(courtAccounts));
        venueSessionStorage.clear();
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
});
