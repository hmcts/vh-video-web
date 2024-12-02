import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { TaskCompleted } from '../on-the-day/models/task-completed';

describe('TaskService', () => {
    let service: TaskService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TaskService);
    });

    it('should emit task completed event', done => {
        const taskCompleted: TaskCompleted = new TaskCompleted('conferenceId', 1);

        service.taskCompleted$.subscribe((event: TaskCompleted) => {
            expect(event).toEqual(taskCompleted);
            done();
        });

        service.emitTaskCompleted(taskCompleted);
    });

    it('should subscribe to task completed event', () => {
        const taskCompleted: TaskCompleted = new TaskCompleted('conferenceId', 1);
        const callback = jasmine.createSpy('callback');

        const subscription = service.taskCompleted$.subscribe(callback);
        service.emitTaskCompleted(taskCompleted);

        expect(callback).toHaveBeenCalledWith(taskCompleted);
        subscription.unsubscribe();
    });
});
