import {
    EndpointStatus,
    ParticipantForUserResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from '../../services/clients/api-client';

export abstract class PanelModel {
    public id: string;
    public isMuted: boolean;
    public handRaised: boolean;
    public displayName: string;
    public pexipId: string;
    public pexipDisplayName: string;
    public orderInTheList: number;
    public role: Role;
    public caseTypeGroup: string;

    constructor(id: string, displayName: string, role: Role, caseTypeGroup: string, pexipDisplayName: string) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.caseTypeGroup = caseTypeGroup;
        this.orderInTheList = this.setOrderInTheList();
        this.pexipDisplayName = pexipDisplayName;
    }

    abstract isInHearing(): boolean;

    private setOrderInTheList(): number {
        switch (this.caseTypeGroup.toLowerCase()) {
            case 'panelmember':
                return 1;
            case 'endpoint':
                return 3;
            case 'observer':
                return 4;
            default:
                return 2;
        }
    }
}

export class ParticipantPanelModel extends PanelModel {
    public status: ParticipantStatus;

    constructor(participant: ParticipantForUserResponse) {
        super(participant.id, participant.display_name, participant.role, participant.case_type_group, participant.tiled_display_name);
        this.status = participant.status;
    }

    isInHearing(): boolean {
        return this.status === ParticipantStatus.InHearing;
    }
}

export class VideoEndpointPanelModel extends PanelModel {
    public status: EndpointStatus;

    constructor(endpoint: VideoEndpointResponse) {
        super(endpoint.id, endpoint.display_name, Role.Individual, 'Endpoint', endpoint.pexip_display_name);
        this.status = endpoint.status;
    }

    isInHearing(): boolean {
        return this.status === EndpointStatus.Connected;
    }
}
