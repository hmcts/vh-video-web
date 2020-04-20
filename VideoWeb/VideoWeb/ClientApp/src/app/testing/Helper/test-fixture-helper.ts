import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from 'src/app/vh-officer/services/models/session-keys';

export class TestFixtureHelper {
    private static venueSessionStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);

    static setupVenues() {
        const venues: HearingVenueResponse[] = [
            new HearingVenueResponse({ id: 1, name: 'test1' }),
            new HearingVenueResponse({ id: 2, name: 'test2' }),
            new HearingVenueResponse({ id: 3, name: 'test3' })
        ];

        this.venueSessionStorage.set(venues);
    }

    static clearVenues() {
        this.venueSessionStorage.clear();
    }
}
