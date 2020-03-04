export class ParticipantHeartbeat {

  constructor(conferenceId: string, participantId: string, heartbeatHealth: HeartbeatHealth,
              browserName: string, browserVersion: string) {
    this.conferenceId = conferenceId;
    this.participantId = participantId;
    this.heartbeatHealth = heartbeatHealth;
    this.browserName = browserName;
    this.browserVersion = browserVersion;
  }

  conferenceId: string;
  participantId: string;
  heartbeatHealth: HeartbeatHealth;
  browserName: string;
  browserVersion: string;
}

export enum HeartbeatHealth {
  None = 'None',
  Good = 'Good',
  Poor = 'Poor',
  Bad = 'Bad',
}
