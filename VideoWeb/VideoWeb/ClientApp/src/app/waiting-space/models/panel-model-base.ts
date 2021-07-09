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
    protected isRemoteMuted: boolean;

    /**
     * Has been spotlighted by the judge
     */
    protected isSpotlighted: boolean;

    /**
     * Has hand raised
     */
    protected handRaised: boolean;

    /**
     * The display name other participants see
     */
    public displayName: string;
    /**
     * The participant id provided by pexip
     */
    public pexipId: string;

    /**
     * The tiled display name provided to pexip on call (<Role>;<Display Name>;<Participant Id>)
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
    private _transferringIn: boolean;

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
        this.pexipDisplayName = pexipDisplayName;
        this.hearingRole = hearingRole;
        this.representee = representee;
        console.log('Faz - PanelModel', this);
        this.orderInTheList = this.setOrderInTheList();
    }

    abstract isInHearing(): boolean;
    abstract isDisconnected(): boolean;
    abstract isAvailable(): boolean;
    abstract isInConsultation(): boolean;

    abstract get isWitnessReadyToJoin(): boolean;

    /**
     * Determines if the panel is hosting the given participant by id
     * @param participantId participant id by VH
     */
    abstract hasParticipant(participantId: string): boolean;
    abstract updateStatus(status, participantId?: string);

    get isJudge(): boolean {
        return this.role === Role.Judge;
    }

    get isJudicialOfficeHolder(): boolean {
        return this.role === Role.JudicialOfficeHolder;
    }

    get isWitness(): boolean {
        return this.hearingRole === HearingRole.WITNESS;
    }

    get transferringIn(): boolean {
        return this._transferringIn;
    }

    updateTransferringInStatus(isTransferringIn: boolean, participantId?: string) {
        this._transferringIn = isTransferringIn;
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
        if (this.role === Role.Judge) {
            return 1;
        } else if (this.role === Role.JudicialOfficeHolder) {
            return 2;
        } else if (this.caseTypeGroup.toLowerCase() === 'endpoint') {
            return 4;
        } else if (this.hearingRole === HearingRole.OBSERVER) {
            return 5;
        } else {
            return 3;
        }
    }
}
