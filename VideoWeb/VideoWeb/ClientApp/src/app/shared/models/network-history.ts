import { PackageLost } from 'src/app/vh-officer/services/models/package-lost';
import { ParticipantSummary } from './participant-summary';

export class NetworkHistory {
    conferenceId: string;
    participant: ParticipantSummary;
    packageLostArray: PackageLost[];
    constructor(conferenceId: string, participant: ParticipantSummary, packageLostArray: PackageLost[]) {
        this.conferenceId = conferenceId;
        this.participant = participant;
        this.packageLostArray = packageLostArray;
    }
}
