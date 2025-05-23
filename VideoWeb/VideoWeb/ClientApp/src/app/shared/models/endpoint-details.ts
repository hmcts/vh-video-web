import { EndpointStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';

export class EndpointDetails {
    private endpoint: VideoEndpointResponse;
    private endpointStatusText: string;

    constructor(endpoint: VideoEndpointResponse) {
        this.endpoint = endpoint;
    }

    get id(): string {
        return this.endpoint.id;
    }

    get currentRoom() {
        return this.endpoint.current_room;
    }

    get externalRefId() {
        return this.endpoint.external_reference_id;
    }

    get status(): EndpointStatus {
        return this.endpoint.status;
    }

    get statusText(): string {
        return this.endpointStatusText;
    }

    get displayName(): string {
        return this.endpoint.display_name;
    }

    get isInterpreterOrInterpretee(): boolean {
        return this.endpoint.participants_linked.length > 0;
    }

    set status(value: EndpointStatus) {
        this.endpoint.status = value;
    }

    set statusText(value: string) {
        this.endpointStatusText = value;
    }

}
