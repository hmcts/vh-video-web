import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ConferenceForHostResponse, Role } from '../../services/clients/api-client';
import { HearingSummary } from './hearing-summary';
import { ParticipantSummary } from './participant-summary';

export class JudgeHearingSummary extends HearingSummary {
    numberOfEndpoints: number;

    constructor(conference: ConferenceForHostResponse) {
        super(conference);
        this.numberOfEndpoints = conference.number_of_endpoints;
    }

    get nonJudicialParticipantsExcludingObservers(): ParticipantSummary[] {
        const observers = [...this.observers];
        const p = this.participants.filter(
            x =>
                (x.role === Role.Individual || x.role === Role.Representative || x.role === Role.QuickLinkParticipant) &&
                !observers.includes(x)
        );
        return p;
    }

    get observers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.OBSERVER || x.role === Role.QuickLinkObserver);
    }

    get panelMembers(): ParticipantSummary[] {
        return this.participants.filter(x => x.isParticipantPanelMember && x.role === Role.JudicialOfficeHolder);
    }

    get wingers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.WINGER && x.role === Role.JudicialOfficeHolder);
    }

    get staffMembers(): ParticipantSummary[] {
        return this.participants.filter(x => x.hearingRole === HearingRole.STAFF_MEMBER);
    }

    isExpired() {
        return super.isExpired(this.conference.closed_date_time);
    }
}
