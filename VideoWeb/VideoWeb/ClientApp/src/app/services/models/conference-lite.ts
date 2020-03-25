export class ConferenceLite {
    id: string;
    caseNumber: string;
    participants: ParticipantLite[];

    constructor(conferenceId: string, caseNumber: string, participants: ParticipantLite[]) {
        this.id = conferenceId;
        this.caseNumber = caseNumber;
        this.participants = participants;
    }
}

export class ParticipantLite {
    id: string;
    username: string;
    obfuscatedDisplayName: string;

    constructor(participantId: string, username: string, obfuscatedDisplayName: string) {
        this.id = participantId;
        this.username = username;
        this.obfuscatedDisplayName = obfuscatedDisplayName;
    }
}
