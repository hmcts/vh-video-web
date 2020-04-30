import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TaskResponse, TaskStatus } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { DataService } from 'src/app/services/data.service';
import { Subscription } from 'rxjs';
import { TaskCompleted } from 'src/app/on-the-day/models/task-completed';

@Component({
    selector: 'app-pending-tasks',
    templateUrl: './pending-tasks.component.html',
    styleUrls: ['./pending-tasks.component.scss']
})
export class PendingTasksComponent implements OnInit, OnDestroy {
    @Input() conferenceId: string;

    taskSubscription$: Subscription;
    tasks: TaskResponse[];

    constructor(private videoWebService: VideoWebService, private dataService: DataService, private logger: Logger) {}

    ngOnInit() {
        this.setupSubscribers();
        this.videoWebService
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
        this.taskSubscription$ = this.dataService.completedTasks().subscribe(completedTask => {
            this.handleTaskCompleted(completedTask);
        });
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
}
