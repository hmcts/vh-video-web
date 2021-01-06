import {
    EndpointStatus,
    ParticipantForUserResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from '../../services/clients/api-client';
import { HearingRole } from './hearing-role-model';

export abstract class PanelModel {
    public id: string;
    public isMuted: boolean;
    public isSpotlighted: boolean;
    public handRaised: boolean;
    public displayName: string;
    public pexipId: string;
    public pexipDisplayName: string;
    public orderInTheList: number;
    public role: Role;
    public caseTypeGroup: string;
    public hearingRole: string;
    public representee: string;
    public transferringIn: boolean;
    public isLocalAudioMuted: boolean;

    constructor(
        id: string,
        displayName: string,
        role: Role,
        caseTypeGroup: string,
        pexipDisplayName: string,
        hearingRole: string,
        representee: string
    ) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.caseTypeGroup = role === Role.Judge ? 'judge' : caseTypeGroup;
        this.orderInTheList = this.setOrderInTheList();
        this.pexipDisplayName = pexipDisplayName;
        this.hearingRole = hearingRole;
        this.representee = representee;
    }

    abstract isInHearing(): boolean;
    abstract isDisconnected(): boolean;
    abstract isAvailable(): boolean;

    get isJudge(): boolean {
        return this.role === Role.Judge;
    }

    get isWitness(): boolean {
        return this.hearingRole === HearingRole.WITNESS;
    }

    private setOrderInTheList(): number {
        switch (this.caseTypeGroup.toLowerCase()) {
            case 'judge':
                return 1;
            case 'panelmember':
                return 2;
            case 'endpoint':
                return 4;
            case 'observer':
                return 5;
            default:
                return 3;
        }
    }
}

export class ParticipantPanelModel extends PanelModel {
    public status: ParticipantStatus;

    constructor(participant: ParticipantForUserResponse) {
        super(
            participant.id,
            participant.display_name,
            participant.role,
            participant.case_type_group,
            participant.tiled_display_name,
            participant.hearing_role,
            participant.representee
        );
        this.status = participant.status;
    }

    isInHearing(): boolean {
        return this.status === ParticipantStatus.InHearing;
    }

    isDisconnected(): boolean {
        return this.status === ParticipantStatus.Disconnected;
    }

    isAvailable(): boolean {
        return this.status === ParticipantStatus.Available;
    }
}

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
