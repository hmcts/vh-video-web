import { UpdateEndpointsDto } from './update-endpoints-dto';

export class EndpointsUpdatedMessage {
    constructor(public conferenceId: string, public endpoints: UpdateEndpointsDto) {}
}
