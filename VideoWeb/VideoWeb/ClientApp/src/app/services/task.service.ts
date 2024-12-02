import { Subject, Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { TaskCompleted } from '../on-the-day/models/task-completed';
import { CallbackFunction } from '../shared/callback-function';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private taskCompleted: Subject<TaskCompleted> = new Subject();

    onTaskCompleted(action: CallbackFunction<TaskCompleted>): Subscription {
        return this.taskCompleted.pipe(map((event: TaskCompleted) => event)).subscribe(action);
    }

    emitTaskCompleted(value: TaskCompleted) {
        this.taskCompleted.next(value);
    }
}
