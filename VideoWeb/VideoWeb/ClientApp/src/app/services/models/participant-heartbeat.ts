export class ParticipantHeartbeat {
    constructor(
        conferenceId: string,
        participantId: string,
        heartbeatHealth: HeartbeatHealth,
        browserName: string,
        browserVersion: string,
        osName: string,
        osVersion: string
    ) {
        this.conferenceId = conferenceId;
        this.participantId = participantId;
        this.heartbeatHealth = heartbeatHealth;
        this.browserName = browserName;
        this.browserVersion = browserVersion;
        this.osName = osName;
        this.osVersion = osVersion;
    }

    conferenceId: string;
    participantId: string;
    heartbeatHealth: HeartbeatHealth;
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
}

export enum HeartbeatHealth {
    None = 'None',
    Good = 'Good',
    Poor = 'Poor',
    Bad = 'Bad'
}
