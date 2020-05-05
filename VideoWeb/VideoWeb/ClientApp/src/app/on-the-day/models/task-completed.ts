export class TaskCompleted {
    constructor(conferenceId: string, taskId: number) {
        this.conferenceId = conferenceId;
        this.taskId = taskId;
    }

    conferenceId: string;
    taskId: number;
}
