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

    @Input() conference: ConferenceResponse;
    @Input() tasks: TaskResponse[];
    @Output() taskCompleted = new EventEmitter<TaskCompleted>();

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.updateDivWidthForTasks();
    }
    constructor(private videoWebService: VideoWebService, private logger: Logger) {}

    ngOnInit() {
        this.updateDivWidthForTasks();
    }

    updateDivWidthForTasks(): void {
        this.taskDivWidth = new VHODashboardHelper().getWidthAvailableForConference();
    }

    getOriginName(task: TaskResponse): string {
        if (task.type !== TaskType.Hearing) {
            const participantTask = this.conference.participants.find((x) => x.id === task.origin_id);
            return participantTask ? participantTask.name : '';
        } else {
            return '';
        }
    }

    async completeTask(task: TaskResponse) {
        try {
            const updatedTask = await this.videoWebService.completeTask(this.conference.id, task.id);
            this.updateTask(updatedTask);
            const pendingTasks = this.tasks.filter((x) => x.status === TaskStatus.ToDo).length;
            this.taskCompleted.emit(new TaskCompleted(this.conference.id, pendingTasks));
        } catch (error) {
            this.logger.error(`Failed to complete task ${task.id}`, error);
        }
    }

    updateTask(updatedTask: TaskResponse) {
        const taskToUpdate = this.tasks.find((x) => x.id === updatedTask.id);
        const index = this.tasks.indexOf(taskToUpdate);
        this.tasks[index] = updatedTask;
    }
}
