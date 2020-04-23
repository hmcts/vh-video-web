import { Guid } from 'guid-typescript';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, TaskResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TasksTestData } from 'src/app/testing/mocks/data/tasks-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { TasksTableComponent } from './tasks-table.component';

describe('TasksTableComponent', () => {
    let component: TasksTableComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();
    const allTasks = new TasksTestData().getTestData();
    const completedTask = new TasksTestData().getCompletedTask();

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getTasksForConference', 'completeTask']);
        videoWebServiceSpy.completeTask.and.returnValue(Promise.resolve(completedTask));
    });

    beforeEach(() => {
        component = new TasksTableComponent(videoWebServiceSpy, new MockLogger());
        component.conference = Object.assign(conference);
        // 1 To-Do & 2 Done
        component.tasks = Object.assign(allTasks);
        spyOn(component, 'updateDivWidthForTasks').and.callFake(() => {
            component.taskDivWidth = 100;
        });
    });

    it('should set task to done', () => {
        const task = component.tasks.filter((x) => x.status === TaskStatus.ToDo)[0];
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
        const pat = component.conference.participants.find((x) => x.role === Role.Judge);
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
        const task = component.tasks.find((x) => x.status === TaskStatus.ToDo);
        spyOn(component.taskCompleted, 'emit');
        await component.completeTask(task);

        const expected = new TaskCompleted(component.conference.id, 0);
        expect(component.taskCompleted.emit).toHaveBeenCalledWith(expected);
    });

    it('should throw error when task cannot complete', async () => {
        component.tasks = new TasksTestData().getTestData();
        const error = { error: 'service error' };
        videoWebServiceSpy.completeTask.and.callFake(() => Promise.reject(error));
        spyOn(component.taskCompleted, 'emit');
        const task = component.tasks.find((x) => x.status === TaskStatus.ToDo);

        await component.completeTask(task);

        expect(component.taskCompleted.emit).toHaveBeenCalledTimes(0);
    });
});
