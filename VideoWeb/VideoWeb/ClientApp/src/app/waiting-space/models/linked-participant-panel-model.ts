import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { HearingRole } from './hearing-role-model';
import { PanelModel } from './panel-model-base';

export class LinkedParticipantPanelModel extends PanelModel {
    public participants: PanelModel[];

    static fromListOfPanelModels(participants: PanelModel[], pexipDisplayName: string, roomid: string): LinkedParticipantPanelModel {
        const lip = participants.find(x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON || x.hearingRole === HearingRole.WITNESS);
        const pexipName = pexipDisplayName;
        const displayName = participants.map(x => x.displayName).join(', ');
        const role = lip.role;
        const caseTypeGroup = lip.caseTypeGroup;
        const hearingRole = lip.hearingRole;
        const representee = lip.representee;

        const model = new LinkedParticipantPanelModel(roomid, displayName, role, caseTypeGroup, pexipName, hearingRole, representee);
        model.participants = participants;
        return model;
    }

    get isWitness(): boolean {
        return this.participants.some(p => p.isWitness);
    }

    isInHearing(): boolean {
        return this.participants.some(p => p.isInHearing());
    }

    isDisconnected(): boolean {
        return this.participants.filter(p => p.isDisconnected()).length === this.participants.length;
    }

    isAvailable(): boolean {
        return this.participants.some(p => p.isAvailable());
    }

    isInConsultation(): boolean {
        return this.participants.some(p => p.isInConsultation());
    }

    hasParticipant(participantId: string): boolean {
        return this.participants.some(p => p.hasParticipant(participantId));
    }

    updateStatus(status: ParticipantStatus, participantId?: string) {
        if (this.participants.some(p => p.id === participantId)) {
            this.participants.find(p => p.id === participantId).updateStatus(status);
        }
    }

    isLocalMicMuted(): boolean {
        return this.participants.some(p => p.isLocalMicMuted());
    }

    isLocalCameraOff(): boolean {
        return this.participants.some(p => p.isLocalCameraOff());
    }

    updateParticipantDeviceStatus(isAudioMuted: boolean, isVideoMuted: boolean, participantId?: string) {
        if (this.participants.some(p => p.id === participantId)) {
            this.participants.find(p => p.id === participantId).updateParticipantDeviceStatus(isAudioMuted, isVideoMuted);
        }
    }
}
