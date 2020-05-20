import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhoStorageKeys } from '../services/models/session-keys';
import { VenueListComponent } from './venue-list.component';

describe('VenueListComponent', () => {
    let component: VenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    const venueSessionStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);

    const venues: HearingVenueResponse[] = [
        new HearingVenueResponse({ id: 1, name: 'test1' }),
        new HearingVenueResponse({ id: 2, name: 'test2' }),
        new HearingVenueResponse({ id: 3, name: 'test3' })
    ];

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getHearingVenues']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    });

    beforeEach(() => {
        component = new VenueListComponent(videoWebServiceSpy, router);
        videoWebServiceSpy.getHearingVenues.and.returnValue(Promise.resolve(venues));
        venueSessionStorage.clear();
    });

    it('should retrieve and populate venues on init', async () => {
        expect(component.venues).toBeUndefined();
        await component.ngOnInit();
        expect(component.venues).toBeDefined();
    });

    it('should update storage with selection', () => {
        const selection = [venues[0]];
        component.selectedVenues = selection;
        component.updateSelection();
        const result = venueSessionStorage.get();
        expect(result.length).toBe(selection.length);
        expect(result[0].id).toBe(selection[0].id);
        expect(result[0].name).toBe(selection[0].name);
    });

    it('should navigate to admin hearing list', () => {
        component.goToHearingList();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    });

    it('should return false when no allocations are selected', () => {
        component.selectedVenues = [];
        expect(component.venuesSelected).toBeFalsy();
    });

    it('should return true when allocations are selected', () => {
        component.selectedVenues = [venues[0]];
        expect(component.venuesSelected).toBeTruthy();
    });
});
