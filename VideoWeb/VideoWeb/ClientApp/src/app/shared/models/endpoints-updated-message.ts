import { VideoEndpointResponse } from 'src/app/services/clients/api-client';

export class EndpointsUpdatedMessage {
    constructor(public conferenceId: string, public endpoints: VideoEndpointResponse[]) {}
}
