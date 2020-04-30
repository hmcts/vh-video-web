import { Injectable } from '@angular/core';
import { TaskCompleted } from '../on-the-day/models/task-completed';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private taskSubject = new Subject<TaskCompleted>();
    constructor() {}

    completedTasks(): Observable<TaskCompleted> {
        return this.taskSubject.asObservable();
    }

    taskCompleted(task: TaskCompleted) {
        this.taskSubject.next(task);
    }
}
