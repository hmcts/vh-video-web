import { EndpointStatus, Role, VideoEndpointResponse } from '../../services/clients/api-client';
import { IndividualPanelModel } from './individual-panel-model';

export class VideoEndpointPanelModel extends IndividualPanelModel {
    public endpointStatus: EndpointStatus;

    constructor(endpoint: VideoEndpointResponse) {
        super(endpoint.id, endpoint.display_name, Role.Individual, 'Endpoint', endpoint.pexip_display_name, 'Video access point', '');
        this.endpointStatus = endpoint.status;
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
        return this.endpointStatus === EndpointStatus.Connected;
    }

    isDisconnected(): boolean {
        return this.endpointStatus === EndpointStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.endpointStatus === EndpointStatus.Connected;
    }

    isInConsultation(): boolean {
        return this.endpointStatus === EndpointStatus.InConsultation;
    }

    hasParticipant(participantId: string): boolean {
        return this.id === participantId;
    }

    updateStatus(status: EndpointStatus, participantId?: string) {
        this.endpointStatus = status;
    }
}
