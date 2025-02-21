import { fakeAsync, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { ApiClient, ConferenceForVhOfficerResponse, ParticipantForUserResponse } from '../../services/clients/api-client';
import { ConferenceTestData } from '../../testing/mocks/data/conference-test-data';
import { VhoQueryService } from './vho-query-service.service';
import { CourtRoomFilter, CourtRoomsAccounts } from './models/court-rooms-accounts';
import { take, takeLast } from 'rxjs/operators';
import { SessionStorage } from 'src/app/services/session-storage';
import { CsoFilter } from './models/cso-filter';
import { VhoStorageKeys } from './models/session-keys';
import { EventsService } from 'src/app/services/events.service';
import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';
import { NewAllocationMessage } from 'src/app/services/models/new-allocation-message';
import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';

describe('VhoQueryService', () => {
    const testData = new ConferenceTestData();
    let service: VhoQueryService;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let eventService: jasmine.SpyObj<EventsService>;

    beforeAll(() => {
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'getConferencesForVhOfficer',
            'getConferenceByIdVHO',
            'getTasks',
            'completeTask',
            'getHeartbeatDataForParticipant',
            'getActiveConferences'
        ]);
        eventService = jasmine.createSpyObj<EventsService>('EventsService', [], {
            getHearingDetailsUpdated: jasmine.createSpy().and.returnValue(of({} as HearingDetailsUpdatedMessage))
        });
    });

    service = new VhoQueryService(apiClient, eventService);
    beforeEach(() => {
        service = new VhoQueryService(apiClient, eventService);
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

    fdescribe('handleAllocationUpdated', () => {
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
            });

            it('should add conference to list when conference allocated to filtered cso', () => {
                const conference = new ConferenceForVhOfficerResponse({
                    id: '123',
                    case_name: 'Case Name',
                    case_number: '12345',
                    case_type: 'Civil',
                    scheduled_date_time: new Date(),
                    participants: [],
                    hearing_venue_name: 'Venue 1',
                    scheduled_duration: 60,
                    closed_date_time: null,
                    allocated_cso: 'test-cso-1',
                    allocated_cso_id: 'test-cso-1'
                });

                const updatedAllocation: UpdatedAllocation = {
                    allocated_to_cso_display_name: 'test-cso-1',
                    allocated_to_cso_id: 'test-cso-1',
                    allocated_to_cso_username: 'test-cso-1',
                    case_name: 'Case Name',
                    conference: conference,
                    conference_id: conference.id,
                    judge_display_name: 'Judge Test',
                    scheduled_date_time: conference.scheduled_date_time
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                service.handleAllocationUpdated(message);

                expect(service['vhoConferences'].length).toBe(4);
            });

            it('should update conference in list when conference is allocated to filtered cso', () => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.allocated_cso = 'test-cso-2';
                updatedConference.allocated_cso_id = 'test-cso-2';

                const updatedAllocation: UpdatedAllocation = {
                    allocated_to_cso_display_name: 'test-cso-2',
                    allocated_to_cso_id: 'test-cso-2',
                    allocated_to_cso_username: 'test-cso-2',
                    case_name: 'Case Name',
                    conference: updatedConference,
                    conference_id: updatedConference.id,
                    judge_display_name: 'Judge Test',
                    scheduled_date_time: updatedConference.scheduled_date_time
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                service.handleAllocationUpdated(message);

                expect(service['vhoConferences'].length).toBe(3);
                const count = service['vhoConferences'].filter(x => x.allocated_cso === 'test-cso-2').length;
                expect(count).toBe(3);
            });

            it('should remove conference from list when conference is not allocated to filtered cso', () => {
                const updatedConference = new ConferenceForVhOfficerResponse({ ...service['vhoConferences'][0] });
                updatedConference.allocated_cso = 'test-cso-3';
                updatedConference.allocated_cso_id = 'test-cso-3';

                const updatedAllocation: UpdatedAllocation = {
                    allocated_to_cso_display_name: 'test-cso-3',
                    allocated_to_cso_id: 'test-cso-3',
                    allocated_to_cso_username: 'test-cso-3',
                    case_name: 'Case Name',
                    conference: updatedConference,
                    conference_id: updatedConference.id,
                    judge_display_name: 'Judge Test',
                    scheduled_date_time: updatedConference.scheduled_date_time
                };
                const message = new NewAllocationMessage([updatedAllocation]);
                service.handleAllocationUpdated(message);

                expect(service['vhoConferences'].length).toBe(2);
                const count = service['vhoConferences'].filter(x => x.allocated_cso === 'test-cso-3').length;
                expect(count).toBe(0);
            });
        });
    });

    it('should update case name and case number conference when hearing detail message contains a conference', () => {
        const conference = new ConferenceForVhOfficerResponse({
            id: '123',
            case_name: 'Case Name',
            case_number: '12345',
            case_type: 'Civil',
            scheduled_date_time: new Date(),
            participants: [],
            hearing_venue_name: 'Venue 1',
            scheduled_duration: 60,
            closed_date_time: null,
            allocated_cso: 'CSO1'
        });
        const originalConference = new ConferenceForVhOfficerResponse({
            id: '123',
            case_name: 'Old Case Name',
            case_number: '54321',
            case_type: 'Criminal',
            scheduled_date_time: new Date(),
            participants: [],
            hearing_venue_name: 'Venue 2',
            scheduled_duration: 30,
            closed_date_time: null,
            allocated_cso: 'CSO1'
        });

        service['vhoConferences'] = [originalConference];
        service['vhoConferencesSubject'].next([originalConference]);

        const message = new HearingDetailsUpdatedMessage(conference);
        service.handleHearingDetailUpdate(message);

        expect(service['vhoConferences'][0].case_name).toBe('Case Name');
        expect(service['vhoConferences'][0].case_number).toBe('12345');
    });

    it('should update judge conference when hearing detail message contains a conference', () => {
        const conference = new ConferenceForVhOfficerResponse({
            id: '123',
            case_name: 'Case Name',
            case_number: '12345',
            case_type: 'Civil',
            scheduled_date_time: new Date(),
            participants: [
                new ParticipantForUserResponse({
                    id: '123',
                    name: 'Judge Test New',
                    hearing_role: 'Judge',
                    representee: null
                })
            ],
            hearing_venue_name: 'Venue 1',
            scheduled_duration: 60,
            closed_date_time: null,
            allocated_cso: 'CSO1'
        });
        const originalConference = new ConferenceForVhOfficerResponse({
            id: '123',
            case_name: 'Old Case Name',
            case_number: '54321',
            case_type: 'Criminal',
            scheduled_date_time: new Date(),
            participants: [
                new ParticipantForUserResponse({
                    id: '123',
                    name: 'Judge Test',
                    hearing_role: 'Judge',
                    representee: null
                })
            ],
            hearing_venue_name: 'Venue 2',
            scheduled_duration: 30,
            closed_date_time: null,
            allocated_cso: 'CSO1'
        });

        service['vhoConferences'] = [originalConference];
        service['vhoConferencesSubject'].next([originalConference]);

        const message = new HearingDetailsUpdatedMessage(conference);
        service.handleHearingDetailUpdate(message);

        expect(service['vhoConferences'][0].case_name).toBe('Case Name');
        expect(service['vhoConferences'][0].participants[0].name).toBe('Judge Test New');
    });

    it('should filter conferences based on selected court rooms in venueNames', () => {
        const conference1 = new ConferenceForVhOfficerResponse({
            id: '1',
            case_name: 'Case 1',
            case_number: '12345',
            case_type: 'Civil',
            scheduled_date_time: new Date(),
            participants: [
                new ParticipantForUserResponse({
                    id: '1',
                    name: 'Judge 1',
                    hearing_role: 'Judge',
                    representee: null
                })
            ],
            hearing_venue_name: 'Venue 1',
            scheduled_duration: 60,
            closed_date_time: null,
            allocated_cso: 'CSO1'
        });

        const conference2 = new ConferenceForVhOfficerResponse({
            id: '2',
            case_name: 'Case 2',
            case_number: '54321',
            case_type: 'Criminal',
            scheduled_date_time: new Date(),
            participants: [
                new ParticipantForUserResponse({
                    id: '2',
                    name: 'Judge 2',
                    hearing_role: 'Judge',
                    representee: null
                })
            ],
            hearing_venue_name: 'Venue 2',
            scheduled_duration: 30,
            closed_date_time: null,
            allocated_cso: 'CSO2'
        });

        service['vhoConferences'] = [conference1, conference2];
        service['vhoConferencesSubject'].next([conference1, conference2]);

        service.venueNames = ['Venue 1'];

        const message = new HearingDetailsUpdatedMessage(conference1);
        service.handleHearingDetailUpdate(message);

        service.getQueryResults().subscribe(result => {
            expect(result.length).toBe(1);
            expect(result[0].hearing_venue_name).toBe('Venue 1');
        });
    });
});
