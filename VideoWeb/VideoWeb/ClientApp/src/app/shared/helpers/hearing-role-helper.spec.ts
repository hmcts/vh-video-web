import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { HearingRoleHelper } from './hearing-role-helper';

describe('HearingRoleHelper', () => {
    const panelMemberRoles = [
        HearingRole.PANEL_MEMBER,
        HearingRole.MEDICAL_MEMBER,
        HearingRole.FINANCIAL_MEMBER,
        HearingRole.LEGAL_MEMBER,
        HearingRole.DISABILITY_MEMBER
    ];
    const allHearingRoles = Object.keys(HearingRole).map(role => HearingRole[role]);

    allHearingRoles.forEach(role => {
        const shouldBePanelMember = panelMemberRoles.includes(role);
        it(`should return ${shouldBePanelMember} for ${role}`, () => {
            expect(HearingRoleHelper.isPanelMember(role)).toBe(shouldBePanelMember);
        });
    });
});
