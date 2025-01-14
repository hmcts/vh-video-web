import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { Role, TaskResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';
import { TaskService } from 'src/app/services/task.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoStorageKeys } from '../services/models/session-keys';
import { VhoQueryService } from '../services/vho-query-service.service';
import { TasksTableComponent } from './tasks-table.component';
import { Hearing } from 'src/app/shared/models/hearing';
import { of } from 'rxjs';

describe('TasksTableComponent', () => {
    let component: TasksTableComponent;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let taskServiceSpy: jasmine.SpyObj<TaskService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const allTasks = new TasksTestData().getTestData();
    const completedTask = new TasksTestData().getCompletedTask();
    let logger: MockLogger;

    beforeAll(() => {
        taskServiceSpy = jasmine.createSpyObj<TaskService>('TaskService', ['emitTaskCompleted']);
        Object.defineProperty(taskServiceSpy, 'taskCompleted$', { value: of() });
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getTasksForConference', 'completeTask']);
        vhoQueryService.getTasksForConference.and.callFake(() => Promise.resolve(allTasks));
        vhoQueryService.completeTask.and.returnValue(Promise.resolve(completedTask));

        logger = new MockLogger();
    });

    beforeEach(() => {
        component = new TasksTableComponent(vhoQueryService, logger, taskServiceSpy);
        const conferenceClone = Object.assign(conference);
        component.conference = conferenceClone;
        component.hearing = new Hearing(conferenceClone);
        // 1 To-Do & 2 Done
        component.tasks = Object.assign(allTasks);

        taskServiceSpy.emitTaskCompleted.calls.reset();
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
        vhoQueryService.getTasksForConference.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.tasks = undefined;

        component.ngOnInit();
        tick();

        expect(component.loading).toBeFalsy();
        expect(spy.calls.mostRecent().args[0]).toMatch('Failed to init tasks list for conference');
        expect(spy.calls.mostRecent().args[1]).toBe(error);
        expect(component.tasks).toBeUndefined();
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
        expect(taskServiceSpy.emitTaskCompleted).toHaveBeenCalledWith(payload);
    });

    it('should throw error when task cannot complete', async () => {
        component.tasks = new TasksTestData().getTestData();
        const error = { error: 'service error' };
        vhoQueryService.completeTask.and.callFake(() => Promise.reject(error));
        const task = component.tasks.find(x => x.status === TaskStatus.ToDo);

        await component.completeTask(task);

        expect(taskServiceSpy.emitTaskCompleted).toHaveBeenCalledTimes(0);
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
        taskServiceSpy.emitTaskCompleted(null);
        expect(component.tasks).not.toBeNull();
        component.ngOnDestroy();
    });

    it('should emit task completed', () => {
        const taskService = new TaskService();
        component = new TasksTableComponent(vhoQueryService, logger, taskService);
        component.conference = conference;
        component.setupSubscribers();
        taskService.emitTaskCompleted(null);
        expect(vhoQueryService.getTasksForConference).toHaveBeenCalledWith(conference.id);
    });

    describe('Self Test Response', () => {
        beforeAll(() => {
            component.sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);
        });
        afterAll(() => {
            component.sessionStorage.clear();
        });
        it('should not display self test error message "Failed self-test (Incomplete Test)" when self test is successfull', () => {
            component.sessionStorage.set(true);
            component.tasks = new TasksTestData().getTestData();
            const task = component.tasks.find(x => x.body !== 'Failed self-test (Incomplete Test)');
            const res = component.getSelfTestResponse(task);
            expect(res).toEqual(true);
        });

        it('should not display self test error message "Failed self-test (Bad Score)" when self test is successfull', () => {
            component.sessionStorage.set(true);
            component.tasks = new TasksTestData().getTestData();
            const task = component.tasks.find(x => x.body !== 'Failed self-test (Bad Score)');
            const res = component.getSelfTestResponse(task);
            expect(res).toEqual(true);
        });

        it('should display rest of the tasks when self test not done', () => {
            component.sessionStorage.set(null);
            component.tasks = new TasksTestData().getTestData();
            const task = component.tasks.find(x => x.body === 'Disconnected');
            const res = component.getSelfTestResponse(task);
            expect(res).toEqual(true);
        });

        it('should display all the tasks when self test not done and session is cleaed', () => {
            component.sessionStorage.clear();
            component.tasks = new TasksTestData().getTestData();
            const task = component.tasks.find(x => x.body === 'Disconnected');
            const res = component.getSelfTestResponse(task);
            expect(res).toEqual(true);
        });
    });
});
