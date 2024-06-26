import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { HearingRole } from './hearing-role-model';
import { IndividualPanelModel } from './individual-panel-model';
import { PanelModel } from './panel-model-base';

export class LinkedParticipantPanelModel extends PanelModel {
    public participants: IndividualPanelModel[] = [];

    get isJudicalOfficeHolder(): boolean {
        return this.participants.every(x => x.role === Role.JudicialOfficeHolder);
    }

    get isWitness(): boolean {
        return this.participants.some(p => p.isWitness);
    }

    get isCallableAndReadyToJoin(): boolean {
        if (this.isWitness) {
            return this.isAvailable();
        } else {
            return this.participants.every(p => p.isCallableAndReadyToJoin);
        }
    }

    get isCallableAndReadyToBeDismissed(): boolean {
        return this.participants.some(p => p.isCallableAndReadyToBeDismissed);
    }
    get isCallable(): boolean {
        return this.participants.some(x => x.isCallable);
    }

    get witnessParticipant(): IndividualPanelModel {
        return this.participants.find(x => x.isWitness);
    }

    get transferringIn(): boolean {
        return this.participants.some(p => p.transferringIn);
    }

    private get participantsInHearing(): IndividualPanelModel[] {
        return this.participants.filter(p => p.isInHearing());
    }

    static fromListOfPanelModels(
        participants: IndividualPanelModel[],
        pexipDisplayName: string,
        roomid: string
    ): LinkedParticipantPanelModel {
        const lip = participants.find(x => x.hearingRole !== HearingRole.INTERPRETER);
        const pexipName = pexipDisplayName;
        const displayName = participants.map(x => x.displayName).join(', ');
        const role = lip.role;
        const hearingRole = lip.hearingRole;
        const representee = lip.representee;
        const model = new LinkedParticipantPanelModel(roomid, displayName, role, pexipName, hearingRole, representee);
        model.participants = participants;
        return model;
    }

    static forJudicialHolders(participants: IndividualPanelModel[], pexipDisplayName: string, roomid: string): LinkedParticipantPanelModel {
        const joh = participants.find(x => x.role === Role.JudicialOfficeHolder);
        const pexipName = pexipDisplayName;
        const displayName = participants.map(x => x.displayName).join(', ');
        const role = joh.role;
        const hearingRole = joh.hearingRole;

        const model = new LinkedParticipantPanelModel(roomid, displayName, role, pexipName, hearingRole, null);
        model.participants = participants;
        return model;
    }

    isInHearing(): boolean {
        return this.participants.some(p => p.isInHearing());
    }

    isDisconnected(): boolean {
        return this.participants.every(p => p.isDisconnected());
    }

    isAvailable(): boolean {
        if (this.isWitness) {
            return this.participants.every(p => p.isAvailable());
        } else {
            return this.participants.some(p => p.isAvailable());
        }
    }

    isInConsultation(): boolean {
        return this.participants.some(p => p.isInConsultation());
    }

    hasParticipant(participantId: string): boolean {
        return this.participants.some(p => p.hasParticipant(participantId));
    }

    updateStatus(status: ParticipantStatus, participantId?: string) {
        if (this.hasParticipant(participantId)) {
            this.participants.find(p => p.id === participantId).updateStatus(status);
        }
    }

    isLocalMicMuted(): boolean {
        return this.participantsInHearing.every(p => p.isLocalMicMuted());
    }

    isLocalCameraOff(): boolean {
        return this.participantsInHearing.every(p => p.isLocalCameraOff());
    }

    updateParticipantDeviceStatus(isAudioMuted: boolean, isVideoMuted: boolean, participantId?: string) {
        if (this.hasParticipant(participantId)) {
            this.participants.find(p => p.id === participantId).updateParticipantDeviceStatus(isAudioMuted, isVideoMuted);
        }
    }

    updateTransferringInStatus(isTransferringIn: boolean, participantId?: string) {
        if (this.hasParticipant(participantId)) {
            this.participants.find(p => p.id === participantId).updateTransferringInStatus(isTransferringIn, participantId);
        }
        if (!participantId) {
            this.participants.forEach(p => p.updateTransferringInStatus(isTransferringIn));
        }
    }

    updateParticipant(
        isRemoteMuted: boolean,
        handRaised: boolean,
        spotlighted: boolean,
        participantId?: string,
        isLocalAudioMuted?: boolean,
        isLocalVideoMuted?: boolean
    ) {
        if (this.hasParticipant(participantId)) {
            this.participants
                .find(p => p.id === participantId)
                .updateParticipant(isRemoteMuted, handRaised, spotlighted, participantId, isLocalAudioMuted, isLocalVideoMuted);
        } else {
            this.participants.forEach(p =>
                p.updateParticipant(isRemoteMuted, handRaised, spotlighted, participantId, isLocalAudioMuted, isLocalVideoMuted)
            );
        }

        this.isRemoteMuted = isRemoteMuted;
        this.isSpotlighted = spotlighted;
        this.updateParticipantDeviceStatus(isLocalAudioMuted, isLocalVideoMuted);
        if (handRaised !== null) {
            this.handRaised = handRaised;
        }
    }

    participantsList(): PanelModel[] {
        return this.participants.map(p => p as PanelModel);
    }
}
