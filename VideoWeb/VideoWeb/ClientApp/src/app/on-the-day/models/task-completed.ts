export class TaskCompleted {
    constructor(
        public conferenceId: string,
        public taskId: number
    ) {
        this.conferenceId = conferenceId;
        this.taskId = taskId;
    }
}
