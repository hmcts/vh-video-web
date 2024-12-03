import { Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { TaskCompleted } from '../on-the-day/models/task-completed';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private taskCompleted: Subject<TaskCompleted> = new Subject();

    get taskCompleted$(): Observable<TaskCompleted> {
        return this.taskCompleted.asObservable();
    }

    emitTaskCompleted(value: TaskCompleted) {
        this.taskCompleted.next(value);
    }
}
