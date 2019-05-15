import { Component, Input } from '@angular/core';
import { ConferenceResponse, TaskResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-tasks-table', template: '' })
export class TasksTableStubComponent {
    @Input() conference: ConferenceResponse;
    @Input() tasks: TaskResponse[];
}
