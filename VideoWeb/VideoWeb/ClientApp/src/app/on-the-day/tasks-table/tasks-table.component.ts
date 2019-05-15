import { Component, OnInit, Input, HostListener } from '@angular/core';
import { TaskResponse, ConferenceResponse } from 'src/app/services/clients/api-client';

@Component({
  selector: 'app-tasks-table',
  templateUrl: './tasks-table.component.html',
  styleUrls: ['./tasks-table.component.scss']
})
export class TasksTableComponent implements OnInit {

  taskDivWidth: number;

  @Input() conference: ConferenceResponse;
  @Input() tasks: TaskResponse[];

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.updateDivWidthForTasks();
  }
  constructor() { }

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

  getOriginName(participantId: string): string {
    return this.conference.participants.find(x => x.id === participantId).name;
  }
}
