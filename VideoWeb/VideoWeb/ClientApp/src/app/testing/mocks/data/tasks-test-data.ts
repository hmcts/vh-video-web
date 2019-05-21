import { TaskResponse, TaskStatus, TaskType } from 'src/app/services/clients/api-client';

export class TasksTestData {
    getTestData(): TaskResponse[] {
        const testData: Array<TaskResponse> = [];

        const task1 = new TaskResponse({
            id: 1,
            origin_id: '9F681318-4955-49AF-A887-DED64554429D',
            status: TaskStatus.ToDo,
            type: TaskType.Participant,
            body: 'Disconnected',
            created: new Date(),
        });
        const task2 = new TaskResponse({
            id: 2,
            origin_id: '9F681318-4955-49AF-A887-DED64554429J',
            status: TaskStatus.Done,
            type: TaskType.Judge,
            body: 'Disconnected',
            created: new Date(),
            updated: new Date(),
            updated_by: 'admin.kinly@hearings.reform.hmcts.net'
        });
        const task3 = new TaskResponse({
            id: 3,
            origin_id: '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            status: TaskStatus.Done,
            type: TaskType.Hearing,
            body: 'Suspended',
            created: new Date(),
            updated: new Date(),
            updated_by: 'admin.kinly@hearings.reform.hmcts.net'
        });

        testData.push(task1);
        testData.push(task2);
        testData.push(task3);
        return testData;
    }

    getCompletedTask(): TaskResponse {
        const task = new TaskResponse({
            id: 1,
            origin_id: '9F681318-4955-49AF-A887-DED64554429D',
            status: TaskStatus.Done,
            type: TaskType.Participant,
            body: 'Disconnected',
            created: new Date(),
            updated: new Date(),
            updated_by: 'admin.kinly@hearings.reform.hmcts.net'
        });
        return task;
    }
}
