import { Role } from '../../services/clients/api-client';
import { HearingRole } from './hearing-role-model';

export abstract class PanelModel {
    /**
     * The participant id provided by VH
     */
    public id: string;

    /**
     * Has been muted by the judge
     */
    private isRemoteMuted: boolean;

    /**
     * Has been spotlighted by the judge
     */
    private isSpotlighted: boolean;

    /**
     * Has hand raised
     */
    private handRaised: boolean;

    /**
     * The display name other participants see
     */
    public displayName: string;
    /**
     * The participant id provided by pexip
     */
    public pexipId: string;

    /**
     * The tiled display name provided to pexip on call (<Tile Position>;<Display Name>;<Participant Id>)
     */
    public pexipDisplayName: string;
    public orderInTheList: number;
    public role: Role;
    public caseTypeGroup: string;
    public hearingRole: string;
    public representee: string;

    /**
     * Is participant transferring into a hearing
     */
    public transferringIn: boolean;

    /**
     * Has participant locally muted microphone
     */
    private isLocalAudioMuted: boolean;

    /**
     * Has participant locally turned off camera
     */
    private isLocalVideoMuted: boolean;

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
    abstract isInConsultation(): boolean;

    /**
     * Determines if the panel is hosting the given participant by id
     * @param participantId participant id by VH
     */
    abstract hasParticipant(participantId: string): boolean;
    abstract updateStatus(status, participantId?: string);

    get isJudge(): boolean {
        return this.role === Role.Judge;
    }

    get isWitness(): boolean {
        return this.hearingRole === HearingRole.WITNESS;
    }

    dimissed() {
        this.handRaised = false;
        this.isSpotlighted = false;
    }

    assignPexipId(pexipId: string) {
        this.pexipId = pexipId;
    }

    updateParticipant(isRemoteMuted: boolean, handRaised: boolean, spotlighted: boolean) {
        this.isRemoteMuted = isRemoteMuted;
        this.handRaised = handRaised;
        this.isSpotlighted = spotlighted;
    }

    updateParticipantDeviceStatus(isAudioMuted: boolean, isVideoMuted: boolean, participantId?: string) {
        this.isLocalVideoMuted = isVideoMuted;
        this.isLocalAudioMuted = isAudioMuted;
    }

    isMicRemoteMuted(): boolean {
        return this.isRemoteMuted;
    }

    isLocalMicMuted(): boolean {
        return this.isLocalAudioMuted;
    }

    isLocalCameraOff(): boolean {
        return this.isLocalVideoMuted;
    }

    hasSpotlight(): boolean {
        return this.isSpotlighted;
    }

    hasHandRaised(): boolean {
        return this.handRaised;
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
