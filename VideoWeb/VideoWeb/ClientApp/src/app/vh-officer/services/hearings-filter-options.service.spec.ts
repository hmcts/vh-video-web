import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { HearingsFilterOptionsService } from './hearings-filter-options.service';

describe('HearingFilterOptionsService', () => {
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
        filter.statuses.forEach(x => (x.selected = true));
        filter.alerts.forEach(x => (x.selected = true));
        const count = component.countOptions(filter);

        // we know statuses otions 6, alerts options 4, number the locations options is dynamic
        expect(count).toBeGreaterThan(9);
    });
});
