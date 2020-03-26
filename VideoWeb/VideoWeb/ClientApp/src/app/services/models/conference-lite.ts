export class ConferenceLite {
    id: string;
    caseNumber: string;
    loggedInParticipantId: string;
    loggedInParticipantDisplayName: string;

    constructor(conferenceId: string, caseNumber: string, loggedInParticipantId: string, loggedInParticipantDisplayName: string) {
        this.id = conferenceId;
        this.caseNumber = caseNumber;
        this.loggedInParticipantId = loggedInParticipantId;
        this.loggedInParticipantDisplayName = loggedInParticipantDisplayName;
    }
}
