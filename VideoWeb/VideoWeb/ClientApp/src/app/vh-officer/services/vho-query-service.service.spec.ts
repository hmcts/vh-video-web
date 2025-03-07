import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ApiClient, ConferenceForVhOfficerResponse } from '../../services/clients/api-client';
import { ConferenceTestData } from '../../testing/mocks/data/conference-test-data';
import { VhoQueryService } from './vho-query-service.service';
import { CourtRoomFilter, CourtRoomsAccounts } from './models/court-rooms-accounts';
import { take, takeLast } from 'rxjs/operators';
import { SessionStorage } from 'src/app/services/session-storage';
import { CsoFilter } from './models/cso-filter';
import { VhoStorageKeys } from './models/session-keys';
import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';
import { NewAllocationMessage } from 'src/app/services/models/new-allocation-message';
import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';
import { eventsServiceSpy, getHearingDetailsUpdatedMock, newAllocationMessageSubjectMock } from 'src/app/testing/mocks/mock-events-service';

describe('VhoQueryService', () => {
    const testData = new ConferenceTestData();
    let service: VhoQueryService;
    let apiClient: jasmine.SpyObj<ApiClient>;
    const newAllocationMessageSubject$ = newAllocationMessageSubjectMock;
    const hearingDetailsUpdatedMessageSubject$ = getHearingDetailsUpdatedMock;

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
        service = new VhoQueryService(apiClient, eventsServiceSpy);
        apiClient.getConferencesForVhOfficer.calls.reset();
    });

    it('should init interval on start', fakeAsync(() => {
        const venueNames = ['venue1', 'venue2'];
        const data = testData.getTestData();
        apiClient.getConferencesForVhOfficer.and.returnValue(of(data));
        spyOn(window, 'setInterval');
        service.startQuery(venueNames, null, false, false);
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

    describe('handleAllocationUpdated', () => {
        describe('CSO filter selected', () => {
            beforeEach(() => {
                const data = testData.getTestData(); // 3 conferences
                data[0].allocated_cso = 'test-cso-1';
                data[0].allocated_cso_id = 'test-cso-1';

                data[1].allocated_cso = 'test-cso-2';
                data[1].allocated_cso_id = 'test-cso-2';

                data[2].allocated_cso = 'test-cso-2';
                data[2].allocated_cso_id = 'test-cso-2';
                service.allocatedCsoIds = ['test-cso-1', 'test-cso-2'];
                service.venueNames = [];
                service['vhoConferences'] = data;
                service.startEventSubscriptions();
            });

            afterEach(() => {
                service.stopQuery();
            });

            it('should add conference to list when conference allocated to filtered cso', fakeAsync(() => {
                const conference = new ConferenceForVhOfficerResponse({
                    ...testData.getConferenceDetailNow(),
                    id: '123',
                    case_name: 'Case Name',
                    case_number: '12345',
                    case_type: 'Civil',
                    scheduled_date_time: new Date(),
                    hearing_venue_name: 'Venue 1',
                    scheduled_duration: 60,
                    closed_date_time: null,
                    allocated_cso: 'test-cso-1',
                    allocated_cso_id: 'test-cso-1'
                });

                const updatedAllocation: UpdatedAllocation = {
                    conference: conference
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                newAllocationMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(4);
            }));

            it('should update conference in list when conference is allocated to filtered cso', fakeAsync(() => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.allocated_cso = 'test-cso-2';
                updatedConference.allocated_cso_id = 'test-cso-2';

                const updatedAllocation: UpdatedAllocation = {
                    conference: updatedConference
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                newAllocationMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(3);
                const count = service['vhoConferences'].filter(x => x.allocated_cso === 'test-cso-2').length;
                expect(count).toBe(3);
            }));

            it('should remove conference from list when conference is not allocated to filtered cso', fakeAsync(() => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.allocated_cso = 'test-cso-3';
                updatedConference.allocated_cso_id = 'test-cso-3';

                const updatedAllocation: UpdatedAllocation = {
                    conference: updatedConference
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                newAllocationMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(2);
                const count = service['vhoConferences'].filter(x => x.allocated_cso === 'test-cso-3').length;
                expect(count).toBe(0);
            }));
        });
    });

    describe('handleHearingDetailUpdate', () => {
        describe('venue filter selected', () => {
            beforeEach(() => {
                const data = testData.getTestData(); // 3 conferences
                data[0].hearing_venue_name = 'hearing-venue-1';
                data[1].hearing_venue_name = 'hearing-venue-2';
                data[2].hearing_venue_name = 'hearing-venue-2';
                service.allocatedCsoIds = [];
                service.venueNames = ['hearing-venue-1', 'hearing-venue-2'];
                service['vhoConferences'] = data;
                service.startEventSubscriptions();
            });

            afterEach(() => {
                service.stopQuery();
            });

            it('should add conference to list when filtered venue includes conference', fakeAsync(() => {
                const conference = new ConferenceForVhOfficerResponse({
                    ...testData.getConferenceDetailNow(),
                    id: '123',
                    case_name: 'Case Name',
                    case_number: '12345',
                    case_type: 'Civil',
                    scheduled_date_time: new Date(),
                    hearing_venue_name: 'hearing-venue-1',
                    scheduled_duration: 60,
                    closed_date_time: null
                });

                const message = new HearingDetailsUpdatedMessage(conference);
                hearingDetailsUpdatedMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(4);
            }));

            it('should update conference in list when filtered venue includes conference', fakeAsync(() => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.hearing_venue_name = 'hearing-venue-2';
                updatedConference.case_name = 'Case Name Updated';
                updatedConference.case_number = 'Case Number Updated';
                updatedConference.scheduled_date_time = new Date();
                updatedConference.scheduled_duration = 9999;

                const message = new HearingDetailsUpdatedMessage(updatedConference);
                hearingDetailsUpdatedMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(3);
                const count = service['vhoConferences'].filter(x => x.hearing_venue_name === 'hearing-venue-2').length;
                expect(count).toBe(3);

                const updated = service['vhoConferences'].find(x => x.id === updatedConference.id);
                expect(updated.case_name).toBe('Case Name Updated');
                expect(updated.case_number).toBe('Case Number Updated');
                expect(updated.scheduled_date_time).toEqual(updatedConference.scheduled_date_time);
                expect(updated.scheduled_duration).toBe(9999);
            }));

            it('should remove conference from list when filtered venue does not include conference', fakeAsync(() => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.hearing_venue_name = 'hearing-venue-3';

                const message = new HearingDetailsUpdatedMessage(updatedConference);
                hearingDetailsUpdatedMessageSubject$.next(message);
                tick();

                expect(service['vhoConferences'].length).toBe(2);
                const count = service['vhoConferences'].filter(x => x.hearing_venue_name === 'hearing-venue-3').length;
                expect(count).toBe(0);
            }));
        });
    });
});
