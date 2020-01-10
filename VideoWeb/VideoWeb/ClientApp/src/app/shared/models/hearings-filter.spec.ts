import { HearingsFilter } from './hearings-filter';

describe('Hearing filter', () => {
  it('should add hearing statuses options on create instance', () => {
    const hearingsFilter = new HearingsFilter();
    expect(hearingsFilter.filterStatuses.length).toBeGreaterThan(0);
  });
  it('should add locations options to hearings filter', () => {
    const hearingsFilter = new HearingsFilter();
    expect(hearingsFilter.filterLocations.length).toBe(0);
    hearingsFilter.addLocations(['location 1', 'location 2']);
    expect(hearingsFilter.filterLocations.length).toBe(2);
  });
  it('should add alerts options to hearings filter', () => {
    const hearingsFilter = new HearingsFilter();
    expect(hearingsFilter.filterAlerts.length).toBe(0);
    hearingsFilter.addAlerts(['alert 1', 'alert 2']);
    expect(hearingsFilter.filterAlerts.length).toBe(2);
  });
});
