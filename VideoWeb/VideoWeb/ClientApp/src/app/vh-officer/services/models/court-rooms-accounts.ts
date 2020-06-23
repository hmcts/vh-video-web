export class CourtRoomFilter {
    constructor(courtRoom: string, selected: boolean) {
        this.courtRoom = courtRoom;
        this.selected = selected;
    }

    courtRoom: string;
    selected: boolean;
}

export class CourtRoomsAccounts {
    constructor(venue: string, courtRooms: string[], selected: boolean) {
        this.venue = venue;
        this.selected = selected;

        this.courtsRooms = courtRooms ? courtRooms.map(x => new CourtRoomFilter(x, true)) : [];
    }

    venue: string;
    selected: boolean;
    courtsRooms: CourtRoomFilter[];

    updateRoomSelection(courtRoomFilters: CourtRoomFilter[]) {
        courtRoomFilters.forEach(c => this.updateCourtrooms(c));
    }

    private updateCourtrooms(previousCourtRoom: CourtRoomFilter) {
        const room = this.courtsRooms.find(x => x.courtRoom === previousCourtRoom.courtRoom);
        if (room) {
            room.selected = previousCourtRoom.selected;
        }
    }
}
