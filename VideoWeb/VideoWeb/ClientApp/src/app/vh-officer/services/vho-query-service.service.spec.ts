import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ApiClient, CourtRoomsAccountResponse } from '../../services/clients/api-client';
import { ConferenceTestData } from '../../testing/mocks/data/conference-test-data';
import { VhoQueryService } from './vho-query-service.service';

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
            'getCourtRoomAccounts',
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
        const interval = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        service.interval = interval;
        spyOn(window, 'clearInterval');
        service.stopQuery();
        expect(clearInterval).toHaveBeenCalledWith(interval);
    }));

    it('should get conferences for vh officer', async () => {
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        const venueNames = ['venue1', 'venue2'];
        service.venueNames = venueNames;
        service.allocatedCsoIds = null;
        service.includeUnallocated = false;
        await service.runQuery();

        expect(apiClient.getConferencesForVhOfficer).toHaveBeenCalledWith(venueNames, [], false);
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
    it('should get court rooms filter', async () => {
        const courtRoomsAccounts1 = new CourtRoomsAccountResponse({ first_name: 'Birmingham', last_names: ['Room 01', 'Room 02'] });
        const courtRoomsAccounts2 = new CourtRoomsAccountResponse({ first_name: 'Manchester', last_names: ['Room 01', 'Room 02'] });
        const courtAccounts: CourtRoomsAccountResponse[] = [];
        courtAccounts.push(courtRoomsAccounts1);
        courtAccounts.push(courtRoomsAccounts2);

        apiClient.getCourtRoomAccounts.and.returnValue(of(courtAccounts));
        const usernames = ['Birmingham', 'Manchester'];
        const result = await service.getCourtRoomsAccounts(usernames, null, false);
        expect(apiClient.getCourtRoomAccounts).toHaveBeenCalledWith(usernames, [], false);
        expect(result).toBe(courtAccounts);
    });
    it('should get court rooms filter when querying by csos', async () => {
        const courtRoomsAccounts1 = new CourtRoomsAccountResponse({ first_name: 'Birmingham', last_names: ['Room 01', 'Room 02'] });
        const courtRoomsAccounts2 = new CourtRoomsAccountResponse({ first_name: 'Manchester', last_names: ['Room 01', 'Room 02'] });
        const courtAccounts: CourtRoomsAccountResponse[] = [];
        courtAccounts.push(courtRoomsAccounts1);
        courtAccounts.push(courtRoomsAccounts2);

        apiClient.getCourtRoomAccounts.and.returnValue(of(courtAccounts));
        const allocatedCsoIds = ['test-cso-1', 'test-cso-2'];
        const result = await service.getCourtRoomsAccounts(null, allocatedCsoIds, true);
        expect(apiClient.getCourtRoomAccounts).toHaveBeenCalledWith([], allocatedCsoIds, true);
        expect(result).toBe(courtAccounts);
    });
});
