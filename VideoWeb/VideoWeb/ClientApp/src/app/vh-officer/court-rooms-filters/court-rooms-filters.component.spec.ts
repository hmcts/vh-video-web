import { CourtRoomsFiltersComponent } from './court-rooms-filters.component';
import { EmitEvent, EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';

describe('CourtRoomsFiltersComponent', () => {
    let component: CourtRoomsFiltersComponent;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;

    const courtRoomsAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], true);
    const courtRoomsAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], true);
    const courtAccounts: CourtRoomsAccounts[] = [];
    courtAccounts.push(courtRoomsAccounts1);
    courtAccounts.push(courtRoomsAccounts2);

    beforeAll(() => {
        eventBusServiceSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);
    });

    beforeEach(() => {
        component = new CourtRoomsFiltersComponent(eventBusServiceSpy);
        component.courtRoomsAccountsFilters = courtAccounts;

    });

    it('should unselect/select all rooms for selected venue', () => {

        // unselect all options
        component.allRoomOptionSelected(1);
        expect(component.courtRoomsAccountsFilters[1].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[1].selected).toBeFalse();

        // select all options
        component.allRoomOptionSelected(1);
        expect(component.courtRoomsAccountsFilters[1].selected).toBeTrue();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeTrue();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[1].selected).toBeTrue();

    });
    it('should given room be unselected', () => {
        component.roomOptionSelected(0, 1);
        expect(component.courtRoomsAccountsFilters[0].selected).toBeFalsy();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[1].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[0].selected).toBeTrue();
    });
});
