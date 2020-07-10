import { CourtRoomsAccounts, CourtRoomFilter } from './court-rooms-accounts';

describe('CourtRoomsAccounts', () => {
    it('should create a list of court rooms with selected options true', () => {
        const courtRoomsAccounts = new CourtRoomsAccounts('manual', ['room01', 'room02'], true);
        expect(courtRoomsAccounts.courtsRooms.length).toBe(2);
        expect(courtRoomsAccounts.courtsRooms[0].selected).toBeTrue();
        expect(courtRoomsAccounts.courtsRooms[1].selected).toBeTrue();
        expect(courtRoomsAccounts.courtsRooms[0].courtRoom).toBe('room01');
        expect(courtRoomsAccounts.courtsRooms[1].courtRoom).toBe('room02');
    });
    it('should update court rooms selected option', () => {
        const courtRoomsAccounts = new CourtRoomsAccounts('manual', ['room01', 'room02'], true);
        courtRoomsAccounts.updateRoomSelection([new CourtRoomFilter('room01', false)]);
        expect(courtRoomsAccounts.courtsRooms[0].selected).toBeFalse();
        expect(courtRoomsAccounts.courtsRooms[1].selected).toBeTrue();
    });
    it('should not update court rooms selected option if room name is not found', () => {
        const courtRoomsAccounts = new CourtRoomsAccounts('manual', ['room01', 'room02'], true);
        courtRoomsAccounts.updateRoomSelection([new CourtRoomFilter('room03', false)]);
        expect(courtRoomsAccounts.courtsRooms[0].selected).toBeTrue();
        expect(courtRoomsAccounts.courtsRooms[1].selected).toBeTrue();
    });
});
