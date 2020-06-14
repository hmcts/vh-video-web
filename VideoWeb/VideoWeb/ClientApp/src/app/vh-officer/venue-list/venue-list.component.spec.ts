import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
// import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhoStorageKeys } from '../services/models/session-keys';
import { VenueListComponent } from './venue-list.component';
import { JudgeNameListResponse } from 'src/app/services/clients/api-client';

describe('VenueListComponent', () => {
    let component: VenueListComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);

    const venues = new JudgeNameListResponse();
    const judgeNames: string[] = [];
    judgeNames.push('Birmingham');
    judgeNames.push('Manchester');
    judgeNames.push('Taylor House');
    venues.first_names = judgeNames;

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getDistinctJudgeNames']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    });

    beforeEach(() => {
        component = new VenueListComponent(videoWebServiceSpy, router);
        videoWebServiceSpy.getDistinctJudgeNames.and.returnValue(Promise.resolve(venues));
        venueSessionStorage.clear();
    });

    it('should retrieve and populate venues on init', async () => {
        expect(component.judges).toBeUndefined();
        await component.ngOnInit();
        expect(component.judges).toBeDefined();
    });

    it('should update storage with selection', () => {
        const selection = [venues[0]];
        component.selectedJudges = selection;
        component.updateSelection();
        const result = venueSessionStorage.get();
        expect(result.length).toBe(selection.length);
    });

    it('should navigate to admin hearing list', () => {
        component.goToHearingList();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminHearingList);
    });

    it('should return false when no allocations are selected', () => {
        component.selectedJudges = [];
        expect(component.venuesSelected).toBeFalsy();
    });

    it('should return true when allocations are selected', () => {
        component.selectedJudges = [venues[0]];
        expect(component.venuesSelected).toBeTruthy();
    });
});
