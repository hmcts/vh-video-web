import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ConferenceForJudgeResponse, Role } from '../../services/clients/api-client';
import { HearingSummary } from './hearing-summary';
import { ParticipantSummary } from './participant-summary';

export class JudgeHearingSummary extends HearingSummary {
    constructor(conference: ConferenceForJudgeResponse) {
        super(conference);
        this.numberOfEndpoints = conference.number_of_endpoints;
    }

    get nonJudicialParticipantsExcludingObservers(): ParticipantSummary[] {
        const p = this.participants.filter(
            x =>
                (x.role === Role.Individual || x.role === Role.Representative) &&
                x.hearingRole !== HearingRole.OBSERVER &&
                x.hearingRole !== HearingRole.PANEL_MEMBER &&
                x.hearingRole !== HearingRole.WINGER &&
                x.hearingRole !== HearingRole.WITNESS
        );
        return p;
    }

    get observers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.OBSERVER);
    }

    get panelMembers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.PANEL_MEMBER);
    }

    get wingers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.WINGER);
    }

    get witnesses(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.WITNESS);
    }

    numberOfEndpoints: number;
}
