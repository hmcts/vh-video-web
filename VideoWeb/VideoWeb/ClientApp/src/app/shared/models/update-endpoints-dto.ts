import { Guid } from "guid-typescript";
import { VideoEndpointResponse } from "../../services/clients/api-client";

export class UpdateEndpointsDto {
    existing_endpoints: VideoEndpointResponse[];
    new_endpoints: VideoEndpointResponse[];
    removed_endpoints: Guid[];
}
