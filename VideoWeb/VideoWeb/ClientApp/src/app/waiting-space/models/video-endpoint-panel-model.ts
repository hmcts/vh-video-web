import { EndpointStatus, Role, VideoEndpointResponse } from '../../services/clients/api-client';
import { PanelModel } from './panel-model-base';

export class VideoEndpointPanelModel extends PanelModel {
    public status: EndpointStatus;

    constructor(endpoint: VideoEndpointResponse) {
        super(endpoint.id, endpoint.display_name, Role.Individual, 'Endpoint', endpoint.pexip_display_name, 'Video access point', '');
        this.status = endpoint.status;
    }

    isInHearing(): boolean {
        return this.status === EndpointStatus.Connected;
    }

    isDisconnected(): boolean {
        return this.status === EndpointStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === EndpointStatus.Connected;
    }
}
