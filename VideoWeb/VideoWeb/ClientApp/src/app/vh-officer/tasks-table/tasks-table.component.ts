import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, TaskResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { VHODashboardHelper } from '../helper';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-tasks-table',
    templateUrl: './tasks-table.component.html',
    styleUrls: ['./tasks-table.component.scss']
})
export class TasksTableComponent implements OnInit {
    taskDivWidth: number;
    loading: boolean;

    @Input() conferenceId: string;
    @Output() taskCompleted = new EventEmitter<TaskCompleted>();
    tasks: TaskResponse[];
    conference: ConferenceResponse;

    @HostListener('window:resize')
    onResize() {
        this.updateDivWidthForTasks();
    }
    constructor(private videoWebService: VideoWebService, private dashboardHelper: VHODashboardHelper, private logger: Logger) {}

    ngOnInit() {
        this.updateDivWidthForTasks();
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

    updateDivWidthForTasks(): void {
        this.taskDivWidth = this.dashboardHelper.getWidthAvailableForConference();
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
        return this.videoWebService.getConferenceByIdVHO(conferenceId);
    }

    retrieveTasksForConference(conferenceId: string): Promise<TaskResponse[]> {
        return this.videoWebService.getTasksForConference(conferenceId);
    }

    async completeTask(task: TaskResponse) {
        try {
            const updatedTask = await this.videoWebService.completeTask(this.conference.id, task.id);
            this.updateTask(updatedTask);
            const pendingTasks = this.tasks.filter(x => x.status === TaskStatus.ToDo).length;
            this.taskCompleted.emit(new TaskCompleted(this.conference.id, pendingTasks));
        } catch (error) {
            this.logger.error(`Failed to complete task ${task.id}`, error);
        }
    }

    updateTask(updatedTask: TaskResponse) {
        const taskToUpdate = this.tasks.find(x => x.id === updatedTask.id);
        const index = this.tasks.indexOf(taskToUpdate);
        this.tasks[index] = updatedTask;
    }
}
