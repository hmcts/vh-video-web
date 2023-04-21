import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import { HearingsFilter } from 'src/app/shared/models/hearings-filter';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';

export class TestFixtureHelper {
    private static venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    private static hearingsFilterStorage = new SessionStorage<HearingsFilter>(VhoStorageKeys.HEARINGS_FITER_KEY);
    private static csoAllocationStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);

    static setupVenues() {
        const venues = ['Birmingham', 'Manchester', 'Taylor House'];
        this.venueSessionStorage.set(venues);
    }

    static clearVenues() {
        this.venueSessionStorage.clear();
    }

    static clearHearingFilters() {
        this.hearingsFilterStorage.clear();
    }

    static setupCsoAllocations() {
        const allocatedCsoIds = ['test-cso-1'];
        const includeUnallocated = true;
        const csoFilter = new CsoFilter(allocatedCsoIds, includeUnallocated);
        this.csoAllocationStorage.set(csoFilter);
    }

    static getCsoAllocations() {
        return this.csoAllocationStorage.get();
    }

    static clearCsoAllocations() {
        this.csoAllocationStorage.clear();
    }
}
