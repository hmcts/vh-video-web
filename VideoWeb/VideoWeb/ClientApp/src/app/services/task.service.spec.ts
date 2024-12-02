import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { TaskCompleted } from '../on-the-day/models/task-completed';

describe('TaskService', () => {
    let service: TaskService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TaskService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit task completed event', done => {
        const taskCompleted: TaskCompleted = new TaskCompleted('conferenceId', 1);

        service.onTaskCompleted((event: TaskCompleted) => {
            expect(event).toEqual(taskCompleted);
            done();
        });

        service.emitTaskCompleted(taskCompleted);
    });

    it('should subscribe to task completed event', () => {
        const taskCompleted: TaskCompleted = new TaskCompleted('conferenceId', 1);
        const callback = jasmine.createSpy('callback');

        const subscription = service.onTaskCompleted(callback);
        service.emitTaskCompleted(taskCompleted);

        expect(callback).toHaveBeenCalledWith(taskCompleted);
        subscription.unsubscribe();
    });
});
