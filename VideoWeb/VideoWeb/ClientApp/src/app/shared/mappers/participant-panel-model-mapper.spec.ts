import { ParticipantForUserResponse, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { LinkedParticipantPanelModel } from 'src/app/waiting-space/models/linked-participant-panel-model';
import { ParticipantPanelModelMapper } from './participant-panel-model-mapper';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';

describe('ParticipantPanelModelMapper', () => {
    let mapper: ParticipantPanelModelMapper;
    const testData = new ConferenceTestData();
    beforeEach(() => {
        mapper = new ParticipantPanelModelMapper();
    });

    it('should map participants with one linked participant', () => {
        // arrange
        let participants = testData.getListOfParticipants();
        const allJOHs = participants.filter(x => x.role === Role.JudicialOfficeHolder);
        const linkedParticipants = testData.getListOfLinkedParticipants();
        participants = participants.concat(linkedParticipants);
        const expectedCount = participants.length - 1 - (allJOHs.length - 1); // take away 1 for interpreter and 1 for additional joh

        // act
        const result = mapper.mapFromParticipantUserResponseArray(participants);

        // assert
        expect(result.length).toBe(expectedCount);
        const linked = result.find(p => p instanceof LinkedParticipantPanelModel) as LinkedParticipantPanelModel;
        const lpIds = linkedParticipants.map(lp => lp.id);
        expect(linked.participants.every(lp => lpIds.includes(lp.id)));
    });

    it('should map participants with two linked participants', () => {
        // arrange
        let participants = testData.getListOfParticipants();
        const allJOHs = participants.filter(x => x.role === Role.JudicialOfficeHolder);
        const linkedParticipants = testData.getListOfLinkedParticipants();
        const witnessLinkedParticipants = testData.getListOfLinkedParticipants(true);
        participants = participants.concat(linkedParticipants).concat(witnessLinkedParticipants);
        const expectedCount = participants.length - 2 - (allJOHs.length - 1); // take away 2 for interpreters and 1 additional joh

        // act
        const result = mapper.mapFromParticipantUserResponseArray(participants);
        // assert
        expect(result.length).toBe(expectedCount);
        const linked = result.filter(p => p instanceof LinkedParticipantPanelModel) as LinkedParticipantPanelModel[];
        expect(linked.length).toBe(3); // two links and a joh
    });

    it('should group johs together', () => {
        // arrange
        const participants = testData.getListOfParticipants();
        const allJOHs = participants.filter(x => x.role === Role.JudicialOfficeHolder);
        const expectedCount = participants.length - (allJOHs.length - 1); // take away additional joh

        // act
        const result = mapper.mapFromParticipantUserResponseArray(participants);

        // assert
        expect(result.length).toBe(expectedCount);
        const linked = result.find(p => p instanceof LinkedParticipantPanelModel && p.isJudicalOfficeHolder) as LinkedParticipantPanelModel;
        const johIds = allJOHs.map(j => j.id);
        expect(linked.participants.every(lp => johIds.includes(lp.id)));
    });

    it('should map linked participants interpreter/interpretee in specific order when available', () => {
        // arrange
        let participants = testData.getListOfParticipants().filter(x => x.role === Role.Individual);

        const linkedParticipants = testData.getListOfLinkedParticipants();
        const witnessLinkedParticipants = testData.getListOfLinkedParticipants(true);
        participants = participants.concat(linkedParticipants).concat(witnessLinkedParticipants);
        // act
        const result = mapper.mapFromParticipantUserResponseArray(participants);

        const linked = result.filter(p => p instanceof LinkedParticipantPanelModel) as LinkedParticipantPanelModel[];

        linked.forEach(x => {
            expect(x.participants[0].hearingRole !== HearingRole.INTERPRETER).toBeTruthy();
            expect(x.participants[1].hearingRole === HearingRole.INTERPRETER).toBeTruthy();
            expect(x.participants.length).toBe(2);
        });

        expect(linked.length).toBe(2); // two linked
    });

    it('should order johs by hearing role then display name', () => {
        // arrange
        let participants: ParticipantForUserResponse[] = [];

        participants.push(
            new ParticipantForUserResponse({
                case_type_group: CaseTypeGroup.PANEL_MEMBER,
                display_name: 'D',
                hearing_role: HearingRole.PANEL_MEMBER,
                role: Role.JudicialOfficeHolder
            })
        );

        participants.push(
            new ParticipantForUserResponse({
                case_type_group: CaseTypeGroup.PANEL_MEMBER,
                display_name: 'A',
                hearing_role: HearingRole.PANEL_MEMBER,
                role: Role.JudicialOfficeHolder
            })
        );

        participants.push(
            new ParticipantForUserResponse({
                case_type_group: CaseTypeGroup.NONE,
                display_name: 'C',
                hearing_role: HearingRole.WINGER,
                role: Role.JudicialOfficeHolder
            })
        );

        participants.push(
            new ParticipantForUserResponse({
                case_type_group: CaseTypeGroup.PANEL_MEMBER,
                display_name: 'B',
                hearing_role: HearingRole.PANEL_MEMBER,
                role: Role.JudicialOfficeHolder
            })
        );

        // act
        const result = mapper.mapFromParticipantUserResponseArray(participants);

        // assert
        const linked = result.filter(p => p instanceof LinkedParticipantPanelModel)[0] as LinkedParticipantPanelModel;

        expect(linked.participants[0].displayName).toBe('A');
        expect(linked.participants[1].displayName).toBe('B');
        expect(linked.participants[2].displayName).toBe('D');
        expect(linked.participants[3].displayName).toBe('C');
        expect(linked.displayName).toBe('A, B, D, C');
    });
});
