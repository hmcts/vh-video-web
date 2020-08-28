import { EndpointStatus } from '../clients/api-client';

export class EndpointStatusMessage {
    constructor(public endpointId: string, public conferenceId: string, public status: EndpointStatus) {}
}
