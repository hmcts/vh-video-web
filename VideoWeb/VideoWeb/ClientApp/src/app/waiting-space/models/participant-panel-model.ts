import { ParticipantForUserResponse, ParticipantStatus } from '../../services/clients/api-client';
import { PanelModel } from './panel-model-base';

export class ParticipantPanelModel extends PanelModel {
    public status: ParticipantStatus;

    constructor(participant: ParticipantForUserResponse) {
        super(
            participant.id,
            participant.display_name,
            participant.role,
            participant.case_type_group,
            participant.tiled_display_name,
            participant.hearing_role,
            participant.representee
        );
        this.status = participant.status;
    }

    get isWitnessReadyToJoin(): boolean {
        return this.isWitness && !this.isInHearing();
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
