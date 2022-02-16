import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

export class HearingRoleHelper {
    static panelMemberRoles = [
        HearingRole.PANEL_MEMBER,
        HearingRole.MEDICAL_MEMBER,
        HearingRole.FINANCIAL_MEMBER,
        HearingRole.LEGAL_MEMBER,
        HearingRole.DISABILITY_MEMBER,
        HearingRole.SPECIALIST_LAY_MEMBER
    ];

    static isPanelMember(hearingRole: string): boolean {
        return HearingRoleHelper.panelMemberRoles.some(panelMemberRole => panelMemberRole === hearingRole);
    }
}
