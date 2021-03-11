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
        let participants = testData.getListOfParticipants();
        const linkedParticipants = testData.getListOfLinkedParticipants();
        participants = participants.concat(linkedParticipants);
        const expectedCount = participants.length - 1; // take away 1 for interpreter
        const result = mapper.mapFromParticipantUserResponse(participants);

        expect(result.length).toBe(expectedCount);
        const linked = result.find(p => p instanceof LinkedParticipantPanelModel) as LinkedParticipantPanelModel;
        const lpIds = linkedParticipants.map(lp => lp.id);
        expect(linked.participants.every(lp => lpIds.includes(lp.id)));
    });

    it('should map participants with two linked participants', () => {
        let participants = testData.getListOfParticipants();
        const linkedParticipants = testData.getListOfLinkedParticipants();
        const witnessLinkedParticipants = testData.getListOfLinkedParticipants(true);
        participants = participants.concat(linkedParticipants).concat(witnessLinkedParticipants);
        const expectedCount = participants.length - 2; // take away 2 for interpreters

        const result = mapper.mapFromParticipantUserResponse(participants);

        expect(result.length).toBe(expectedCount);
        const linked = result.filter(p => p instanceof LinkedParticipantPanelModel) as LinkedParticipantPanelModel[];
        expect(linked.length).toBe(2);
    });
});
