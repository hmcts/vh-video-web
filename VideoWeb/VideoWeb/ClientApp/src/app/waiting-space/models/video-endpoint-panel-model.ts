import { EndpointStatus, Role } from '../../services/clients/api-client';
import { VHEndpoint } from '../store/models/vh-conference';
import { IndividualPanelModel } from './individual-panel-model';

export class VideoEndpointPanelModel extends IndividualPanelModel {
    public status: EndpointStatus;

    constructor(endpoint: VHEndpoint) {
        super(endpoint.id, endpoint.displayName, Role.Individual, endpoint?.pexipInfo?.pexipDisplayName, 'Video access point', '');

        this.status = endpoint.status;
    }

    get isCallableAndReadyToJoin(): boolean {
        return false;
    }

    get isCallableAndReadyToBeDismissed(): boolean {
        return false;
    }
    get isCallable(): boolean {
        return false;
    }

    isInHearing(): boolean {
        return this.status === EndpointStatus.InHearing;
    }

    isDisconnected(): boolean {
        return this.status === EndpointStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === EndpointStatus.Connected || this.status === EndpointStatus.InConsultation;
    }

    isInConsultation(): boolean {
        return this.status === EndpointStatus.InConsultation;
    }

    hasParticipant(participantId: string): boolean {
        return this.id === participantId;
    }

    updateStatus(status: EndpointStatus, participantId?: string) {
        this.status = status;
    }
}
