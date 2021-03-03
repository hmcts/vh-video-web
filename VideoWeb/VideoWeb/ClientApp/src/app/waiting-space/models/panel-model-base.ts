import { Role } from '../../services/clients/api-client';
import { HearingRole } from './hearing-role-model';
import { ParticipantUpdated } from './video-call-models';

export abstract class PanelModel {
    public id: string;
    public isRemoteMuted: boolean;
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
    public isLocalVideoMuted: boolean;

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

    updateParticipant(updatedParticipant: ParticipantUpdated) {
        this.pexipId = updatedParticipant.uuid;
        this.isRemoteMuted = updatedParticipant.isRemoteMuted;
        this.handRaised = updatedParticipant.handRaised;
        this.isSpotlighted = updatedParticipant.isSpotlighted;
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
