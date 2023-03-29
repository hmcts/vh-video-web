import { Guid } from "guid-typescript";
import { VideoEndpointResponse } from "../../services/clients/api-client";

export class UpdateEndpointsDto {
    ExistingEndpoints: VideoEndpointResponse[];
    NewEndpoints: VideoEndpointResponse[];
    RemovedEndpoints: Guid[];
}
