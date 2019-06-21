import { Component, OnInit, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { TaskResponse, ConferenceResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { TaskCompleted } from '../../on-the-day/models/task-completed';

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
  constructor(private videoWebService: VideoWebService) { }

  ngOnInit() {
    this.updateDivWidthForTasks();
  }

  updateDivWidthForTasks(): void {
    const listColumnElement: HTMLElement = document.getElementById('list-column');
    const listWidth = listColumnElement.offsetWidth;
    const windowWidth = window.innerWidth;
    const frameWidth = windowWidth - listWidth - 30;
    this.taskDivWidth = frameWidth;
  }

  getOriginName(task: TaskResponse): string {
    if (task.type !== TaskType.Hearing) {
      return this.conference.participants.find(x => x.id === task.origin_id).name;
    } else {
      return '';
    }
  }

  completeTask(task: TaskResponse) {
    this.videoWebService.completeTask(this.conference.id, task.id).toPromise()
      .then((updatedTask: TaskResponse) => {
        this.updateTask(updatedTask);
        const pendingTasks = this.tasks.filter(x => x.status === TaskStatus.ToDo).length;
        this.taskCompleted.emit(new TaskCompleted(this.conference.id, pendingTasks));
      });
  }

  updateTask(updatedTask: TaskResponse) {
    const taskToUpdate = this.tasks.find(x => x.id === updatedTask.id);
    const index = this.tasks.indexOf(taskToUpdate);
    this.tasks[index] = updatedTask;
  }
}
