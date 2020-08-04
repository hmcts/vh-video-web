import { Role } from '../../services/clients/api-client';

export class ParticipantPanelModel {
    public participantId: string;
    public isMuted: boolean;
    public handRaised: boolean;
    public displayName: string;
    public orderInTheList: number;
    public role: Role;
    public caseTypeGroup: string;

    constructor(participantId: string, displayName: string, role: Role, caseTypeGroup: string) {
        this.participantId = participantId;
        this.displayName = displayName;
        this.role = role;
        this.caseTypeGroup = caseTypeGroup;
        this.orderInTheList = this.setOrderInTheList();
    }

    private setOrderInTheList(): number {
        let order: number;
        switch (this.caseTypeGroup.toLowerCase()) {
            case 'panelmember':
                order = 1;
                break;
            case 'observer':
                order = 3;
                break;
            default:
                order = 2;
        }

        return order;
    }
}
