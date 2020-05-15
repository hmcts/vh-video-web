import { Component, Input, OnInit } from '@angular/core';
import { ConferenceResponse, TaskResponse, TaskType } from 'src/app/services/clients/api-client';
import { EmitEvent, EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { TaskCompleted } from '../../on-the-day/models/task-completed';

@Component({
    selector: 'app-tasks-table',
    templateUrl: './tasks-table.component.html',
    styleUrls: ['./tasks-table.component.scss', '../vho-global-styles.scss']
})
export class TasksTableComponent implements OnInit {
    loading: boolean;

    @Input() conferenceId: string;
    tasks: TaskResponse[];
    conference: ConferenceResponse;

    constructor(private vhoQueryService: VhoQueryService, private logger: Logger, private eventbus: EventBusService) {}

    ngOnInit() {
        this.loading = true;
        this.retrieveConference(this.conferenceId)
            .then(async conference => {
                this.conference = conference;
                this.tasks = await this.retrieveTasksForConference(this.conference.id);
                this.loading = false;
            })
            .catch(err => {
                this.logger.error(`Failed to init tasks list for conference ${this.conferenceId}`, err);
            });
    }

    getOriginName(task: TaskResponse): string {
        if (task.type !== TaskType.Hearing) {
            const participantTask = this.conference.participants.find(x => x.id === task.origin_id);
            return participantTask ? participantTask.name : '';
        } else {
            return '';
        }
    }

    retrieveConference(conferenceId): Promise<ConferenceResponse> {
        return this.vhoQueryService.getConferenceByIdVHO(conferenceId);
    }

    retrieveTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        return this.vhoQueryService.getTasksForConference(conferenceId);
    }

    async completeTask(task: TaskResponse) {
        try {
            const updatedTask = await this.vhoQueryService.completeTask(this.conference.id, task.id);
            this.updateTask(updatedTask);
            const payload = new TaskCompleted(this.conference.id, task.id);
            this.eventbus.emit(new EmitEvent(VHEventType.TaskCompleted, payload));
        } catch (error) {
            this.logger.error(`Failed to complete task ${task.id}`, error);
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
}
