import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';
import { TaskResponse, TaskStatus } from 'src/app/services/clients/api-client';
import { EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from '../services/vho-query-service.service';

@Component({
    selector: 'app-pending-tasks',
    templateUrl: './pending-tasks.component.html',
    styleUrls: ['./pending-tasks.component.scss', '../vho-global-styles.scss']
})
export class PendingTasksComponent implements OnInit, OnDestroy {
    @Input() conferenceId: string;

    taskSubscription$: Subscription;
    tasks: TaskResponse[];

    constructor(private queryService: VhoQueryService, private eventbus: EventBusService, private logger: Logger) {}

    ngOnInit() {
        this.setupSubscribers();
        this.queryService
            .getTasksForConference(this.conferenceId)
            .then(tasks => (this.tasks = tasks))
            .catch(err => this.logger.error(`Failed to get tasks for ${this.conferenceId}`, err));
    }

    ngOnDestroy(): void {
        if (this.taskSubscription$) {
            this.taskSubscription$.unsubscribe();
        }
    }

    setupSubscribers() {
        this.taskSubscription$ = this.eventbus.on<TaskCompleted>(VHEventType.TaskCompleted, completedTask =>
            this.handleTaskCompleted(completedTask)
        );
    }

    handleTaskCompleted(completedTask: TaskCompleted) {
        const task = this.tasks.find(t => t.id === completedTask.taskId);
        if (task) {
            task.status = TaskStatus.Done;
        }
    }

    get pendingTasks(): number {
        if (this.tasks) {
            return this.tasks.filter(x => x.status === TaskStatus.ToDo).length;
        } else {
            return 0;
        }
    }

    getAlertStatus(): string {
        return this.pendingTasks > 0 ? 'alert-full.png' : 'alert-empty.png';
    }
}
