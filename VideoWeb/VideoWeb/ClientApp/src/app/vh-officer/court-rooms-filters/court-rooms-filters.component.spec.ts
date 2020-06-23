import { CourtRoomsFiltersComponent } from './court-rooms-filters.component';
import { EventBusService } from 'src/app/services/event-bus.service';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';

describe('CourtRoomsFiltersComponent', () => {
    let component: CourtRoomsFiltersComponent;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;

    const courtAccounts: CourtRoomsAccounts[] = [];

    beforeAll(() => {
        eventBusServiceSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);
    });

    beforeEach(() => {
        const courtRoomsAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], true);
        const courtRoomsAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], true);
        courtAccounts.push(courtRoomsAccounts1);
        courtAccounts.push(courtRoomsAccounts2);

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
    it('should unselected the court room', () => {
        component.roomOptionSelected(0, 1);
        expect(component.courtRoomsAccountsFilters[0].selected).toBeFalsy();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[1].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[0].selected).toBeTrue();
    });
    it('should apply filter emit filter event', () => {
        component.applyFilters();
        expect(eventBusServiceSpy.emit).toHaveBeenCalled();
    });
    it('should on cancel reset filter with all options selected', () => {
        component.allRoomOptionSelected(1);
        expect(component.courtRoomsAccountsFilters[1].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeFalse();

        component.cancelFilters();
        expect(component.courtRoomsAccountsFilters[1].selected).toBeTrue();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeTrue();
        expect(component.courtRoomsAccountsFilters[1].courtsRooms[0].selected).toBeTrue();

        expect(eventBusServiceSpy.emit).toHaveBeenCalled();
    });
});
