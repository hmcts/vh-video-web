import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ConferenceResponse, TaskResponse, TaskType } from 'src/app/services/clients/api-client';
import { TaskService } from 'src/app/services/task.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { VhoQueryService } from '../services/vho-query-service.service';
import { Subject } from 'rxjs';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../services/models/session-keys';
import { Hearing } from 'src/app/shared/models/hearing';
import { takeUntil } from 'rxjs/operators';

@Component({
    standalone: false,
    selector: 'app-tasks-table',
    templateUrl: './tasks-table.component.html',
    styleUrls: ['./tasks-table.component.scss', '../vho-global-styles.scss']
})
export class TasksTableComponent implements OnInit, OnDestroy {
    @Input() hearing: Hearing;

    loading: boolean;
    tasks: TaskResponse[];
    conference: ConferenceResponse;
    sessionStorage = new SessionStorage<boolean>(VhoStorageKeys.EQUIPMENT_SELF_TEST_KEY);

    private destroyed$ = new Subject();

    constructor(
        private vhoQueryService: VhoQueryService,
        private logger: Logger,
        private taskService: TaskService
    ) {}

    ngOnInit() {
        this.loading = true;
        this.setupSubscribers();
        this.conference = this.hearing.getConference();
        this.logger.debug('[TasksTable] - Getting tasks for conference', { conference: this.conference.id });
        this.retrieveTasksForConference(this.conference.id)
            .then(tasks => {
                this.tasks = tasks;
                this.loading = false;
            })
            .catch(err => {
                this.logger.error(`[TasksTable] - Failed to init tasks list for conference ${this.conference.id}`, err, {
                    conference: this.conference.id
                });
            })
            .finally(() => {
                this.loading = false;
            });
    }

    getSelfTestResponse(task: TaskResponse): boolean {
        return (
            !this.sessionStorage.get() ||
            (task.body !== 'Failed self-test (Incomplete Test)' && task.body !== 'Failed self-test (Bad Score)')
        );
    }

    getOriginName(task: TaskResponse): string {
        if (task.type !== TaskType.Hearing) {
            const participantTask = this.conference.participants.find(x => x.id === task.origin_id);
            return participantTask ? participantTask.name : '';
        } else {
            return '';
        }
    }

    retrieveTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        return this.vhoQueryService.getTasksForConference(conferenceId);
    }

    async completeTask(task: TaskResponse) {
        try {
            this.logger.debug('[TasksTable] - Attempting to complete task', { conference: this.conference.id, task: task.id });
            const updatedTask = await this.vhoQueryService.completeTask(this.conference.id, task.id);
            this.updateTask(updatedTask);
            const payload = new TaskCompleted(this.conference.id, task.id);
            this.taskService.emitTaskCompleted(payload);
        } catch (error) {
            this.logger.error(`[TasksTable] - Failed to complete task ${task.id}`, error);
        }
    }

    updateTask(updatedTask: TaskResponse) {
        const taskToUpdate = this.tasks.find(x => x.id === updatedTask.id);
        const index = this.tasks.indexOf(taskToUpdate);
        this.tasks[index] = updatedTask;
    }

    usernameWithoutDomain(username: string) {
        if (username) {
            return username.split('@')[0];
        } else {
            return null;
        }
    }

    setupSubscribers() {
        this.taskService.taskCompleted$.pipe(takeUntil(this.destroyed$)).subscribe(() => this.handlePageRefresh());
    }

    async handlePageRefresh() {
        this.tasks = await this.retrieveTasksForConference(this.conference.id);
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }
}
