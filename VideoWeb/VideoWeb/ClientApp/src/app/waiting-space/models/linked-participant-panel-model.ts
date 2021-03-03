import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { HearingRole } from './hearing-role-model';
import { PanelModel } from './panel-model-base';

export class LinkedParticipantPanelModel extends PanelModel {
    public participants: PanelModel[];
    public status: ParticipantStatus;

    static fromListOfPanelModels(participants: PanelModel[], pexipDisplayName: string, roomid: string): LinkedParticipantPanelModel {
        const lip = participants.find(x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON);
        const pexipName = pexipDisplayName;
        const displayName = participants.map(x => x.displayName).join(' ');
        const role = lip.role;
        const caseTypeGroup = lip.caseTypeGroup;
        const hearingRole = lip.hearingRole;
        const representee = lip.representee;

        const model = new LinkedParticipantPanelModel(roomid, displayName, role, caseTypeGroup, pexipName, hearingRole, representee);
        model.participants = participants;
        return model;
    }

    isInHearing(): boolean {
        return this.participants.filter(p => p.isInHearing()).length > 0;
    }

    isDisconnected(): boolean {
        return this.participants.filter(p => p.isDisconnected()).length === this.participants.length;
    }

    isAvailable(): boolean {
        return this.participants.filter(p => p.isAvailable()).length > 0;
    }
}
