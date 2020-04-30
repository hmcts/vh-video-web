import { VideoWebService } from 'src/app/services/api/video-web.service';
import { DataService } from 'src/app/services/data.service';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { PendingTasksComponent } from './pending-tasks.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { Subject } from 'rxjs';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { TaskResponse } from 'src/app/services/clients/api-client';

describe('PendingTasksComponent', () => {
    let component: PendingTasksComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let dataServiceSpy: jasmine.SpyObj<DataService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    // 1 To-Do & 2 Done
    let allTasks: TaskResponse[];
    let logger: MockLogger;

    const subject = new Subject<TaskCompleted>();

    beforeAll(() => {
        dataServiceSpy = jasmine.createSpyObj<DataService>('DataService', ['taskCompleted', 'completedTasks']);
        dataServiceSpy.completedTasks.and.returnValue(subject.asObservable());
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getTasksForConference']);
        videoWebServiceSpy.getTasksForConference.and.callFake(() => Promise.resolve(allTasks));

        logger = new MockLogger();
    });

    beforeEach(() => {
        allTasks = new TasksTestData().getTestData();
        component = new PendingTasksComponent(videoWebServiceSpy, dataServiceSpy, logger);
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
        videoWebServiceSpy.getTasksForConference.and.callFake(() => Promise.reject(error));
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

        subject.next(taskCompleted);

        expect(component.pendingTasks).toBe(0);
    });

    it('should ignore tasks not in list', () => {
        const taskCompleted = new TaskCompleted(Guid.create().toString(), 9999);
        component.setupSubscribers();

        subject.next(taskCompleted);

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
});
