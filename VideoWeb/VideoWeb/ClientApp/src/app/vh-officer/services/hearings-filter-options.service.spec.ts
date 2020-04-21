import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse } from '../../services/clients/api-client';
import { HearingsFilterOptionsService } from './hearings-filter-options.service';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';

describe('HearingFilterOptionsService', () => {
    const venueList = [new HearingVenueResponse({ id: 1, name: 'Birmingham' })];
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getHearingVenues']);
    videoWebServiceSpy.getHearingVenues.and.returnValue(Promise.resolve(venueList));

    const component = new HearingsFilterOptionsService();

    beforeEach(() => {
        TestFixtureHelper.clearHearingFilters();
    });

    afterAll(() => {
        TestFixtureHelper.clearHearingFilters();
    });

    it('should get hearings filter object with number selected options 0', async () => {
        const filter = await component.getFilter();
        expect(filter.alerts.length).toBe(4);
        expect(filter.statuses.length).toBe(6);
        expect(filter.numberFilterOptions).toBe(0);
    });
    it('should count selected filter options', async () => {
        const filter = await component.getFilter();
        filter.statuses.forEach((x) => (x.Selected = true));
        filter.alerts.forEach((x) => (x.Selected = true));
        const count = component.countOptions(filter);

        // we know statuses otions 6, alerts options 4, number the locations options is dynamic
        expect(count).toBeGreaterThan(9);
    });
});
