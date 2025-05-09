import { Role } from '../../services/clients/api-client';
import { HearingRole } from './hearing-role-model';

export abstract class PanelModel {
    /**
     * The participant id provided by VH
     */
    public id: string;

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
    public hearingRole: string;
    public representee: string;

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

    constructor(id: string, displayName: string, role: Role, pexipDisplayName: string, hearingRole: string, representee: string) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.pexipDisplayName = pexipDisplayName;
        this.hearingRole = hearingRole;
        this.representee = representee;
        this.orderInTheList = this.setOrderInTheList();
    }

    get isJudge(): boolean {
        return this.role === Role.Judge;
    }

    get isHost(): boolean {
        return this.role === Role.Judge || this.role === Role.StaffMember;
    }

    get isJudicialOfficeHolder(): boolean {
        return this.role === Role.JudicialOfficeHolder;
    }

    get isWitness(): boolean {
        return this.hearingRole === HearingRole.WITNESS || this.hearingRole === HearingRole.EXPERT;
    }

    get isQuickLinkUser(): boolean {
        return this.role === Role.QuickLinkObserver || this.role === Role.QuickLinkParticipant;
    }

    get transferringIn(): boolean {
        return this._transferringIn;
    }

    abstract get isCallableAndReadyToBeDismissed(): boolean;
    abstract get isCallableAndReadyToJoin(): boolean;
    abstract get isCallable(): boolean;

    updateTransferringInStatus(isTransferringIn: boolean, participantId?: string) {
        this._transferringIn = isTransferringIn;
    }

    assignPexipId(pexipId: string) {
        this.pexipId = pexipId ?? this.pexipId;
    }

    updateParticipant(
        isRemoteMuted: boolean,
        handRaised: boolean,
        spotlighted: boolean,
        participantId?: string,
        isLocalAudioMuted?: boolean,
        isLocalVideoMuted?: boolean
    ) {
        this.isRemoteMuted = isRemoteMuted ?? this.isRemoteMuted;
        this.handRaised = handRaised ?? this.handRaised;
        this.isSpotlighted = spotlighted ?? this.isSpotlighted;
        this.updateParticipantDeviceStatus(isLocalAudioMuted, isLocalVideoMuted, participantId);
    }

    updateParticipantDeviceStatus(isAudioMuted: boolean, isVideoMuted: boolean, participantId?: string) {
        this.isLocalVideoMuted = isVideoMuted ?? this.isLocalVideoMuted;
        this.isLocalAudioMuted = isAudioMuted ?? this.isLocalAudioMuted;
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

    participantsList(): PanelModel[] {
        return [this];
    }

    private setOrderInTheList(): number {
        if (this.role === Role.Judge) {
            return 1;
        } else if (this.role === Role.JudicialOfficeHolder) {
            return 2;
        } else if (this.role === Role.StaffMember) {
            return 3;
        } else if (this.role === Role.QuickLinkParticipant) {
            return 5;
        } else if (this.hearingRole === 'Video access point') {
            return 6;
        } else if (this.hearingRole === HearingRole.OBSERVER) {
            return 7;
        } else if (this.role === Role.QuickLinkObserver) {
            return 8;
        } else {
            return 4;
        }
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
}
