import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';
import { HearingsFilter } from 'src/app/shared/models/hearings-filter';

export class TestFixtureHelper {
    private static venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    private static hearingsFilterStorage = new SessionStorage<HearingsFilter>(VhoStorageKeys.HEARINGS_FITER_KEY);

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
}
