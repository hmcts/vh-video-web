import { CourtRoomsFiltersComponent } from './court-rooms-filters.component';
import { EventBusService } from 'src/app/services/event-bus.service';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';
import { VhoQueryService } from '../services/vho-query-service.service';

describe('CourtRoomsFiltersComponent', () => {
    let component: CourtRoomsFiltersComponent;
    let vhoQueryServiceSpy: jasmine.SpyObj<VhoQueryService>;

    const courtAccounts: CourtRoomsAccounts[] = [];

    beforeAll(() => {
        vhoQueryServiceSpy = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['updateCourtRoomsAccountFilters']);
    });

    beforeEach(() => {
        const courtRoomsAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], true);
        const courtRoomsAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], true);
        courtAccounts.push(courtRoomsAccounts1);
        courtAccounts.push(courtRoomsAccounts2);

        component = new CourtRoomsFiltersComponent(vhoQueryServiceSpy);
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
        expect(component.disableFilterApply).toBeFalse();
    });
    it('should unselected the court room', () => {
        component.roomOptionSelected(0, 1);
        expect(component.courtRoomsAccountsFilters[0].selected).toBeFalsy();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[1].selected).toBeFalse();
        expect(component.courtRoomsAccountsFilters[0].courtsRooms[0].selected).toBeTrue();
        expect(component.disableFilterApply).toBeFalse();
    });
    it('should apply filter emit filter event', () => {
        component.applyFilters();
        expect(vhoQueryServiceSpy.updateCourtRoomsAccountFilters).toHaveBeenCalled();
        expect(component.disableFilterApply).toBeTrue();
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

        expect(vhoQueryServiceSpy.updateCourtRoomsAccountFilters).toHaveBeenCalled();
        expect(component.disableFilterApply).toBeTrue();
    });
});
