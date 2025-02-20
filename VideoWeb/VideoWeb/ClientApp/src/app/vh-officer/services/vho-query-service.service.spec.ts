import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ApiClient } from '../../services/clients/api-client';
import { ConferenceTestData } from '../../testing/mocks/data/conference-test-data';
import { VhoQueryService } from './vho-query-service.service';
import { CourtRoomFilter, CourtRoomsAccounts } from './models/court-rooms-accounts';
import { take, takeLast } from 'rxjs/operators';
import { SessionStorage } from 'src/app/services/session-storage';
import { CsoFilter } from './models/cso-filter';
import { VhoStorageKeys } from './models/session-keys';

describe('VhoQueryService', () => {
    const testData = new ConferenceTestData();
    let service: VhoQueryService;
    let apiClient: jasmine.SpyObj<ApiClient>;

    beforeAll(() => {
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'getConferencesForVhOfficer',
            'getConferenceByIdVHO',
            'getTasks',
            'completeTask',
            'getHeartbeatDataForParticipant',
            'getActiveConferences'
        ]);
    });

    beforeEach(() => {
        service = new VhoQueryService(apiClient);
        apiClient.getConferencesForVhOfficer.calls.reset();
    });

    it('should init interval on start', fakeAsync(() => {
        const venueNames = ['venue1', 'venue2'];
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        spyOn(window, 'setInterval');
        service.startQuery(venueNames, null, false, false);
        tick();
        expect(service.venueNames).toBe(venueNames);
        expect(setInterval).toHaveBeenCalled();
    }));

    it('should init interval on start when querying by cso', fakeAsync(() => {
        const venueNames = null;
        const allocatedCsoIds = ['test-cso-1', 'test-cso-2'];
        const includeUnallocated = true;
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        spyOn(window, 'setInterval');
        service.startQuery(venueNames, allocatedCsoIds, includeUnallocated, false);
        tick();
        expect(service.venueNames.length).toBe(0);
        expect(service.allocatedCsoIds).toBe(allocatedCsoIds);
        expect(service.includeUnallocated).toBe(includeUnallocated);
        expect(setInterval).toHaveBeenCalled();
    }));

    it('should clear interval on stop', fakeAsync(() => {
        const interval = jasmine.createSpyObj('number', ['ref', 'unref']);
        service.interval = interval;
        spyOn(window, 'clearInterval');
        service.stopQuery();
        expect(clearInterval).toHaveBeenCalledWith(interval);
    }));

    it('should get conferences for vh officer with no filter', async () => {
        service.updateCourtRoomsAccountFilters([]);
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;

        await service.runQuery();

        service.updateCourtRoomsAccountFilters([]);
        expect(apiClient.getConferencesForVhOfficer).toHaveBeenCalledWith(venueNames, [], false);

        service.getQueryResults().subscribe(result => {
            expect(result).toEqual(data);
        });

        service.getFilteredQueryResults().subscribe(result => {
            expect(result).toEqual(data);
        });
    });

    it('should ignore conferences when filter is not selected', async () => {
        service.updateCourtRoomsAccountFilters([]);
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;

        await service.runQuery();

        const courtRooms = new CourtRoomsAccounts('Birmingham', ['Judge Fudge'], false);
        courtRooms.updateRoomSelection([new CourtRoomFilter('Judge Fudge', false)]);
        service.updateCourtRoomsAccountFilters([courtRooms]);
        expect(apiClient.getConferencesForVhOfficer).toHaveBeenCalledWith(venueNames, [], false);

        service.getQueryResults().subscribe(result => {
            expect(result).toEqual(data);
        });

        service.getFilteredQueryResults().subscribe(result => {
            expect(result).toEqual([]);
        });
    });

    it('should get conferences for vh officer with filtered', async () => {
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;
        await service.runQuery();

        expect(apiClient.getConferencesForVhOfficer).toHaveBeenCalledWith(venueNames, [], false);

        service.getQueryResults().subscribe(result => {
            expect(result).toEqual(data);
        });

        service
            .getAvailableCourtRoomFilters()
            .pipe(takeLast(1))
            .subscribe(result => {
                expect(result[0].venue).toEqual('Birmingham');
                expect(result[0].selected).toBeTrue();
                expect(result[0].courtsRooms[0]).toEqual(new CourtRoomFilter('Judge Fudge', true));
                expect(result[1].venue).toEqual('Manchester');
                expect(result[1].selected).toBeTrue();
                expect(result[1].courtsRooms[0]).toEqual(new CourtRoomFilter('Judge Fudge', true));
            });

        service.updateCourtRoomsAccountFilters([
            new CourtRoomsAccounts('Birmingham', ['Judge Fudge'], true),
            new CourtRoomsAccounts('Birmingham', ['Made up'], true)
        ]);
        service.getFilteredQueryResults().subscribe(result => {
            expect(result.length).toBe(1);
            expect(result[0].hearing_venue_name).toEqual('Birmingham');
            expect(result.some(conference => conference.hearing_venue_name === 'Manchester')).toBeFalse();
        });
    });

    it('should retain previous filters when new data is emitted', async () => {
        service.updateCourtRoomsAccountFilters([]);
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;

        await service.runQuery();

        service
            .getAvailableCourtRoomFilters()
            .pipe(take(1))
            .subscribe(result => {
                expect(result[0].venue).toEqual('Birmingham');
                expect(result[0].selected).toBeTrue();
                expect(result[0].courtsRooms[0]).toEqual(new CourtRoomFilter('Judge Fudge', true));
                expect(result[1].venue).toEqual('Manchester');
                expect(result[1].selected).toBeTrue();
                expect(result[1].courtsRooms[0]).toEqual(new CourtRoomFilter('Judge Fudge', true));
            });

        const bhamOnly = data.filter(x => x.hearing_venue_name === 'Birmingham');
        apiClient.getConferencesForVhOfficer.and.returnValue(of(bhamOnly));

        await service.runQuery();

        service.getAvailableCourtRoomFilters().subscribe(result => {
            expect(result.length).toBe(1);
            expect(result[0].venue).toEqual('Birmingham');
            expect(result[0].selected).toBeTrue();
            expect(result[0].courtsRooms[0]).toEqual(new CourtRoomFilter('Judge Fudge', true));
        });
    });

    it('should get conferences for vh officer when querying by cso', async () => {
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const allocatedCsoIds = ['test-cso-1', 'test-cso-2'];
        service.venueNames = null;
        service.allocatedCsoIds = allocatedCsoIds;
        service.includeUnallocated = false;
        await service.runQuery();

        expect(apiClient.getConferencesForVhOfficer).toHaveBeenCalledWith([], allocatedCsoIds, false);
    });

    it('should get active conferences when querying for active sessions only', async () => {
        const data = testData.getTestData();
        apiClient.getActiveConferences.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;
        service.activeSessionsOnly = true;
        await service.runQuery();

        expect(apiClient.getActiveConferences).toHaveBeenCalledWith();
    });

    it('should get observable object', () => {
        const venueNames = ['venue1', 'venue2'];
        const result = service.getConferencesForVHOfficer(venueNames);

        expect(result).toEqual(jasmine.any(Observable));
    });

    it('should get conference by id for vho', async () => {
        const data = testData.getConferenceDetailNow();
        apiClient.getConferenceByIdVHO.and.returnValue(of(data));
        const id = '123456';

        const result = await service.getConferenceByIdVHO(id);
        expect(apiClient.getConferenceByIdVHO).toHaveBeenCalledWith(id);
        expect(result).toBe(data);
    });

    it('should get tasks for conference by id', async () => {
        const data = testData.getTasksForConference();
        apiClient.getTasks.and.returnValue(of(data));
        const id = '123456';

        const result = await service.getTasksForConference(id);

        expect(apiClient.getTasks).toHaveBeenCalledWith(id);
        expect(result).toBe(data);
    });

    it('should complete test', async () => {
        const confId = '123456';
        const taskId = 98765;
        apiClient.completeTask.and.returnValue(of());

        await service.completeTask(confId, taskId);
        expect(apiClient.completeTask).toHaveBeenCalledWith(confId, taskId);
    });

    it('should get heartbeats for a participant', async () => {
        const data = testData.getParticipantHeartbeatResponse();
        apiClient.getHeartbeatDataForParticipant.and.returnValue(of(data));
        const confId = '123456';
        const participantId = '98765';

        const result = await service.getParticipantHeartbeats(confId, participantId);
        expect(result).toBe(data);
    });

    it('should get cso filters from storage', async () => {
        // arrange
        const storage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);
        const filter = new CsoFilter(['test-cso-1', 'test-cso-2'], true);
        storage.set(filter);

        // act
        const actual = service.getCsoFilterFromStorage();

        // assert
        expect(actual.allocatedCsoIds).toEqual(filter.allocatedCsoIds);
        expect(actual.includeUnallocated).toEqual(filter.includeUnallocated);
    });
});
