import { ParticipantStatus, Role } from '../../services/clients/api-client';
import { IndividualPanelModel } from './individual-panel-model';

export class ParticipantPanelModel extends IndividualPanelModel {
    constructor(
        id: string,
        displayName: string,
        role: Role,
        pexipDisplayName: string,
        hearingRole: string,
        representee: string,
        public status: ParticipantStatus
    ) {
        super(id, displayName, role, pexipDisplayName, hearingRole, representee);
    }

    get isCallableAndReadyToJoin(): boolean {
        return this.isCallable && this.isAvailable();
    }

    get isCallableAndReadyToBeDismissed(): boolean {
        return this.isCallable && this.isInHearing();
    }
    get isCallable(): boolean {
        return this.isWitness || this.isQuickLinkUser;
    }

    isInHearing(): boolean {
        return this.status === ParticipantStatus.InHearing;
    }

    isDisconnected(): boolean {
        return this.status === ParticipantStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === ParticipantStatus.InConsultation || this.status === ParticipantStatus.Available;
    }

    isInConsultation(): boolean {
        return this.status === ParticipantStatus.InConsultation;
    }

    hasParticipant(participantId: string): boolean {
        return this.id === participantId;
    }

    updateStatus(status: ParticipantStatus) {
        this.status = status;
    }
}
