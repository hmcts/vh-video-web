import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { TaskResponse, TaskStatus } from 'src/app/services/clients/api-client';
import { TaskService } from 'src/app/services/task.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from '../services/vho-query-service.service';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-pending-tasks',
    templateUrl: './pending-tasks.component.html',
    styleUrls: ['./pending-tasks.component.scss', '../vho-global-styles.scss']
})
export class PendingTasksComponent implements OnInit, OnDestroy {
    @Input() conferenceId: string;

    tasks: TaskResponse[];

    private destroyed$ = new Subject();

    constructor(
        private queryService: VhoQueryService,
        private taskService: TaskService,
        private logger: Logger
    ) {}

    get pendingTasks(): number {
        if (this.tasks) {
            return this.tasks.filter(x => x.status === TaskStatus.ToDo).length;
        } else {
            return 0;
        }
    }

    ngOnInit() {
        this.setupSubscribers();
        this.logger.debug('[PendingTasks] - Getting tasks for conference', { conference: this.conferenceId });
        this.queryService
            .getTasksForConference(this.conferenceId)
            .then(tasks => (this.tasks = tasks))
            .catch(err =>
                this.logger.error(`[PendingTasks] - Failed to get tasks for ${this.conferenceId}`, err, { conference: this.conferenceId })
            );
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    setupSubscribers() {
        this.taskService.taskCompleted$
            .pipe(takeUntil(this.destroyed$))
            .subscribe(completedTask => this.handleTaskCompleted(completedTask));
    }

    handleTaskCompleted(completedTask: TaskCompleted) {
        this.logger.debug('[PendingTasks] - Marking task as completed', { conference: this.conferenceId, task: completedTask.taskId });
        const task = this.tasks.find(t => t.id === completedTask.taskId);
        if (task) {
            task.status = TaskStatus.Done;
        }
    }

    getAlertStatus(): string {
        return this.pendingTasks > 0 ? 'alert-full.png' : 'alert-empty.png';
    }
}
