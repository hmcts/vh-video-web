import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { Role, TaskResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';
import { EmitEvent, EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoQueryService } from '../services/vho-query-service.service';
import { TasksTableComponent } from './tasks-table.component';

describe('TasksTableComponent', () => {
    let component: TasksTableComponent;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const allTasks = new TasksTestData().getTestData();
    const completedTask = new TasksTestData().getCompletedTask();
    let logger: MockLogger;

    beforeAll(() => {
        eventBusServiceSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', [
            'getConferenceByIdVHO',
            'getTasksForConference',
            'completeTask'
        ]);
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conference));
        vhoQueryService.getTasksForConference.and.callFake(() => Promise.resolve(allTasks));
        vhoQueryService.completeTask.and.returnValue(Promise.resolve(completedTask));

        logger = new MockLogger();
    });

    beforeEach(() => {
        component = new TasksTableComponent(vhoQueryService, logger, eventBusServiceSpy);
        component.conferenceId = conference.id;
        component.conference = Object.assign(conference);
        // 1 To-Do & 2 Done
        component.tasks = Object.assign(allTasks);

        eventBusServiceSpy.emit.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should get tasks on init', fakeAsync(() => {
        component.tasks = undefined;
        component.conference = undefined;
        component.ngOnInit();
        tick();
        expect(component.loading).toBeFalsy();
        expect(component.conference).toEqual(conference);
        expect(component.tasks.length).toBeGreaterThan(0);
    }));

    it('should log error when unable to init', fakeAsync(() => {
        const error = new Error('failed to find conference');
        vhoQueryService.getConferenceByIdVHO.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.tasks = undefined;
        component.conference = undefined;

        component.ngOnInit();
        tick();

        expect(component.loading).toBeTruthy();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to init tasks list for conference`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
        expect(component.tasks).toBeUndefined();
        expect(component.conference).toBeUndefined();
    }));

    it('should set task to done', () => {
        const task = component.tasks.filter(x => x.status === TaskStatus.ToDo)[0];
        const index = component.tasks.indexOf(task);
        component.updateTask(completedTask);

        const taskUpdated = component.tasks[index];
        expect(taskUpdated.updated).toBe(completedTask.updated);
        expect(taskUpdated.updated_by).toBe(completedTask.updated_by);
        expect(taskUpdated.status).toBe(TaskStatus.Done);
    });

    it('should return username for participant tasks', () => {
        const pat = component.conference.participants[0];
        const task = new TaskResponse({
            type: TaskType.Participant,
            id: 1,
            origin_id: pat.id
        });

        expect(component.getOriginName(task)).toBe(pat.name);
    });

    it('should return blank string if id not found', () => {
        const task = new TaskResponse({
            type: TaskType.Participant,
            id: 1,
            origin_id: Guid.create().toString()
        });

        expect(component.getOriginName(task)).toBe('');
    });

    it('should return username for judge tasks', () => {
        const pat = component.conference.participants.find(x => x.role === Role.Judge);
        const task = new TaskResponse({
            type: TaskType.Judge,
            id: 1,
            origin_id: pat.id
        });

        expect(component.getOriginName(task)).toBe(pat.name);
    });

    it('should  who raised a hearing task', () => {
        const task = new TaskResponse({
            type: TaskType.Hearing,
            id: 1,
            origin_id: component.conference.id,
            body: 'suspended'
        });

        expect(component.getOriginName(task)).toBe('');
    });

    it('should emit task completed', async () => {
        component.tasks = new TasksTestData().getTestData();
        const task = component.tasks.find(x => x.status === TaskStatus.ToDo);
        await component.completeTask(task);

        const payload = new TaskCompleted(component.conference.id, task.id);
        const expected = new EmitEvent(VHEventType.TaskCompleted, payload);
        expect(eventBusServiceSpy.emit).toHaveBeenCalledWith(expected);
    });

    it('should throw error when task cannot complete', async () => {
        component.tasks = new TasksTestData().getTestData();
        const error = { error: 'service error' };
        vhoQueryService.completeTask.and.callFake(() => Promise.reject(error));
        const task = component.tasks.find(x => x.status === TaskStatus.ToDo);

        await component.completeTask(task);

        expect(eventBusServiceSpy.emit).toHaveBeenCalledTimes(0);
    });

    it('should return username without domain', () => {
        const username = 'test@user1.com';
        const reult = component.usernameWithoutDomain(username);
        expect(reult).toBe('test');
    });

    it('should return null when username is not provided', () => {
        const username = null;
        const reult = component.usernameWithoutDomain(username);
        expect(reult).toBeNull();
    });

    it('should handle page refresh on notification', () => {
        component.ngOnInit();
        eventBusServiceSpy.emit(new EmitEvent<TaskCompleted>(VHEventType.TaskCompleted, null));
        expect(component.tasks).not.toBeNull();
        component.ngOnDestroy();
    });

    it('should emit task completed', () => {
        const eventbus = new EventBusService();
        component = new TasksTableComponent(vhoQueryService, logger, eventbus);
        component.conference = conference;
        component.setupSubscribers();
        eventbus.emit(new EmitEvent<TaskCompleted>(VHEventType.PageRefreshed, null));
        expect(vhoQueryService.getTasksForConference).toHaveBeenCalledWith(conference.id);
    });
});
