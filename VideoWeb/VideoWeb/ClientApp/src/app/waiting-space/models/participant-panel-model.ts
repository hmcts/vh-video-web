import { ParticipantStatus, Role } from '../../services/clients/api-client';
import { PanelModel } from './panel-model-base';

export class ParticipantPanelModel extends PanelModel {
    constructor(
        id: string,
        displayName: string,
        role: Role,
        caseTypeGroup: string,
        pexipDisplayName: string,
        hearingRole: string,
        representee: string,
        public status: ParticipantStatus
    ) {
        super(id, displayName, role, caseTypeGroup, pexipDisplayName, hearingRole, representee);
    }

    get isWitnessOrQuickLinkUserReadyToJoin(): boolean {
        return (this.isWitness || this.isQuickLinkUser) && !this.isInHearing();
    }

    isInHearing(): boolean {
        return this.status === ParticipantStatus.InHearing;
    }

    isDisconnected(): boolean {
        return this.status === ParticipantStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === ParticipantStatus.Available;
    }

    isInConsultation(): boolean {
        return this.status === ParticipantStatus.InConsultation;
    }

    hasParticipant(participantId: string): boolean {
        return this.id === participantId;
    }

    updateStatus(status: ParticipantStatus, participantId?: string) {
        this.status = status;
    }
}
