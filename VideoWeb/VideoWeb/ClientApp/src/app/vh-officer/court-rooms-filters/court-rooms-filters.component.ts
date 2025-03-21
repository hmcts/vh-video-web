import { Component, Input } from '@angular/core';
import { CourtRoomsAccounts } from '../services/models/court-rooms-accounts';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    standalone: false,
    selector: 'app-court-rooms-filters',
    templateUrl: './court-rooms-filters.component.html',
    styleUrls: ['./court-rooms-filters.component.scss']
})
export class CourtRoomsFiltersComponent {
    @Input() courtRoomsAccountsFilters: CourtRoomsAccounts[];
    disableFilterApply = true;

    constructor(private vhoQueryService: VhoQueryService) {}

    allRoomOptionSelected(venueIndex: number) {
        const venue = this.courtRoomsAccountsFilters[venueIndex];
        venue.selected = !venue.selected;
        venue.courtsRooms.forEach(x => (x.selected = venue.selected));
        this.disableFilterApply = false;
    }

    roomOptionSelected(venueIndex: number, roomIndex: number) {
        const venue = this.courtRoomsAccountsFilters[venueIndex];
        const room = venue.courtsRooms[roomIndex];
        room.selected = !room.selected;
        venue.selected = venue.courtsRooms.every(x => x.selected);
        this.disableFilterApply = false;
    }

    applyFilters() {
        this.disableFilterApply = true;
        this.vhoQueryService.updateCourtRoomsAccountFilters(this.courtRoomsAccountsFilters);
    }

    cancelFilters() {
        this.disableFilterApply = true;
        this.courtRoomsAccountsFilters.forEach(x => this.resetCourtRoomSelectOption(x));
        this.applyFilters();
    }

    private resetCourtRoomSelectOption(courtRoomsAccounts: CourtRoomsAccounts) {
        courtRoomsAccounts.selected = true;
        courtRoomsAccounts.courtsRooms.forEach(x => (x.selected = true));
    }
}
