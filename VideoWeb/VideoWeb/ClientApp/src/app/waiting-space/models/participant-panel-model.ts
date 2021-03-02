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

    isInHearing(): boolean {
        return this.status === ParticipantStatus.InHearing;
    }

    isDisconnected(): boolean {
        return this.status === ParticipantStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === ParticipantStatus.Available;
    }
}
