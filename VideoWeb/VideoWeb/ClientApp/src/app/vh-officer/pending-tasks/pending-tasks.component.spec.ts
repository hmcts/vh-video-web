import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TaskResponse } from 'src/app/services/clients/api-client';
import { EmitEvent, EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { PendingTasksComponent } from './pending-tasks.component';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';

describe('PendingTasksComponent', () => {
    let component: PendingTasksComponent;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    const eventbus = new EventBusService();
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    // 1 To-Do & 2 Done
    let allTasks: TaskResponse[];
    let logger: MockLogger;

    beforeAll(() => {
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getTasksForConference']);
        vhoQueryService.getTasksForConference.and.callFake(() => Promise.resolve(allTasks));

        logger = new MockLogger();
    });

    beforeEach(() => {
        allTasks = new TasksTestData().getTestData();
        component = new PendingTasksComponent(vhoQueryService, eventbus, logger);
        component.conferenceId = conference.id;
        component.tasks = Object.assign(allTasks);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should retrieve tasks on init', fakeAsync(() => {
        component.tasks = undefined;
        component.ngOnInit();
        tick();
        expect(component.tasks).toBeDefined();
        component.ngOnDestroy();
    }));

    it('should log error when unable to init', fakeAsync(() => {
        // reset to override before each
        component.tasks = undefined;
        const error = { error: 'failed to find conference', error_code: 404 };
        vhoQueryService.getTasksForConference.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.ngOnInit();
        tick();
        expect(component.tasks).toBeUndefined();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get tasks for`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
    }));

    it('should handle complete task on notification', () => {
        const taskCompleted = new TaskCompleted(conference.id, allTasks[0].id);
        component.setupSubscribers();

        eventbus.emit(new EmitEvent<TaskCompleted>(VHEventType.TaskCompleted, taskCompleted));

        expect(component.pendingTasks).toBe(0);
    });

    it('should ignore tasks not in list', () => {
        const taskCompleted = new TaskCompleted(Guid.create().toString(), 9999);
        component.setupSubscribers();

        eventbus.emit(new EmitEvent<TaskCompleted>(VHEventType.TaskCompleted, taskCompleted));

        expect(component.pendingTasks).toBe(1);
    });

    it('should return number of pending tasks', () => {
        component.tasks = Object.assign(allTasks);
        expect(component.pendingTasks).toBe(1);
    });

    it('should return 0 when tasks are not defined', () => {
        component.tasks = undefined;
        expect(component.pendingTasks).toBe(0);
    });

    it('should return empty image if no pending alerts', () => {
        component.tasks = undefined;
        expect(component.pendingTasks).toBe(0);
        expect(component.getAlertStatus()).toBe('alert-empty.png');
    });

    it('should return IM image if there are pending alerts', () => {
        component.tasks = Object.assign(allTasks);
        expect(component.getAlertStatus()).toBe('alert-full.png');
    });
});
