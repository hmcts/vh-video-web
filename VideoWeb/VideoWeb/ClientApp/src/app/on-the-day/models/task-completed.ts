export class TaskCompleted {

    constructor(conferenceId: string, pendingTasks: number) {
        this.conferenceId = conferenceId;
        this.pendingTasks = pendingTasks;
    }

    conferenceId: string;
    pendingTasks: number;
}
