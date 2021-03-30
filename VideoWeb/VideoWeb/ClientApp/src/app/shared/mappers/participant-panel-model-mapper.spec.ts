import { Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { LinkedParticipantPanelModel } from 'src/app/waiting-space/models/linked-participant-panel-model';
import { ParticipantPanelModelMapper } from './participant-panel-model-mapper';

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
        const result = mapper.mapFromParticipantUserResponse(participants);

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
        const result = mapper.mapFromParticipantUserResponse(participants);
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
        const result = mapper.mapFromParticipantUserResponse(participants);

        // assert
        expect(result.length).toBe(expectedCount);
        const linked = result.find(p => p instanceof LinkedParticipantPanelModel && p.isJudicalOfficeHolder) as LinkedParticipantPanelModel;
        const johIds = allJOHs.map(j => j.id);
        expect(linked.participants.every(lp => johIds.includes(lp.id)));
    });
});
