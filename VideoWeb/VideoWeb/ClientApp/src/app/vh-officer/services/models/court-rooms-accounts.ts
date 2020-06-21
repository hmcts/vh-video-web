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
        this.courtsRooms = courtRooms.map(x => new CourtRoomFilter(x, false));
    }

    venue: string;
    selected: boolean;
    courtsRooms: CourtRoomFilter[];
}
