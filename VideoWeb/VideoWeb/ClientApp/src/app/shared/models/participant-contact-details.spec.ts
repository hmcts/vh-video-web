import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantContactDetails } from './participant-contact-details';

describe('ParticipantContactDetails', () => {
    it('should map participant info', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        const p = new ParticipantContactDetails(participant);
        expect(participant.id).toBe(p.id);
        expect(participant.name).toBe(p.name);
        expect(participant.status).toBe(p.status);
        expect(participant.role).toBe(p.role);
        expect(participant.case_type_group).toBe(p.caseGroup);
        expect(participant.display_name).toBe(p.displayName);
        expect(participant.username).toBe(p.username);
        expect(participant.hearing_venue_name).toBe(p.hearingVenueName);
        expect(participant.contact_email).toBe(p.contactEmail);
        expect(participant.contact_telephone).toBe(p.contactTelephone);
        expect(p.initialedName).toBe('C Green');
        expect(participant.ref_id).toBe(p.refId);
        expect(participant.judge_in_another_hearing).toBe(p.judgeInAnotherHearing);
        expect(p.isJudge).toBe(false);
    });
});
