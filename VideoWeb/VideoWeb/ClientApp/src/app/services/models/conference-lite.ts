export class ConferenceLite {
    id: string;
    caseNumber: string;

    constructor(conferenceId: string, caseNumber: string) {
        this.id = conferenceId;
        this.caseNumber = caseNumber;
    }
}
