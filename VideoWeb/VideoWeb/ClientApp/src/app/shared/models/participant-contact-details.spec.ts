import { LinkedParticipantResponse, LinkType, ParticipantContactDetailsResponseVho, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
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
        expect(participant.hearing_role).toBe(p.hearingRole);
        expect(participant.case_type_group).toBe(p.caseGroup);
        expect(participant.display_name).toBe(p.displayName);
        expect(participant.username).toBe(p.username);
        expect(participant.hearing_venue_name).toBe(p.hearingVenueName);
        expect(participant.contact_email).toBe(p.contactEmail);
        expect(participant.contact_telephone).toBe(p.contactTelephone);
        expect(p.initialedName).toBe('C Green');
        expect(participant.ref_id).toBe(p.refId);
        expect(participant.host_in_another_hearing).toBe(p.hostInAnotherHearing);
        expect(p.isJudge).toBe(false);
        expect(p.showCaseRole).toBe(true);
    });
    it('should map participant info based on hearing role', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.representee = 'test user';
        participant.hearing_role = 'App Representative';
        const p = new ParticipantContactDetails(participant);
        expect(p.hearingRole).toBe('App Representative for test user');
    });
    it('should not show case role if case role is none', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.case_type_group = 'None';
        const p = new ParticipantContactDetails(participant);
        expect(p.showCaseRole).toBe(false);
    });
    it('should not show case role if case role is null', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.case_type_group = null;
        const p = new ParticipantContactDetails(participant);
        expect(p.showCaseRole).toBe(false);
    });
    it('should not show case role if case role is judge', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.case_type_group = 'Judge';
        const p = new ParticipantContactDetails(participant);
        expect(p.showCaseRole).toBe(false);
    });
    it('should not show case role if case role is observer', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.case_type_group = 'Observer';
        const p = new ParticipantContactDetails(participant);
        expect(p.showCaseRole).toBe(false);
    });
    it('should not show case role if case role is staff member', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.case_type_group = CaseTypeGroup.STAFF_MEMBER;
        const p = new ParticipantContactDetails(participant);

        expect(p.showCaseRole).toBe(false);
    });
    it('should return true if participant is an interpreter', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const participant = participants[0];
        participant.hearing_role = 'Interpreter';
        participant.case_type_group = 'Applicant';
        const p = new ParticipantContactDetails(participant);
        expect(p.isInterpreterOrInterpretee).toBe(true);
    });
    it('should return true if participant is an interpretee', () => {
        const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            'C7163972-A362-4167-8D33-77A64674B31C',
            'MyVenue'
        );
        const _linkedParticipants: LinkedParticipantResponse[] = [];
        const lp = new LinkedParticipantResponse();
        lp.link_type = LinkType.Interpreter;
        lp.linked_id = '1000';
        _linkedParticipants.push(lp);
        const participant = participants[0];
        participant.hearing_role = 'Litigant in person';
        participant.case_type_group = 'Applicant';
        participant.linked_participants = _linkedParticipants;
        const p = new ParticipantContactDetails(participant);
        expect(p.isInterpreterOrInterpretee).toBe(true);
    });

    describe('isQuickLinkUser', () => {
        let participant: ParticipantContactDetailsResponseVho;
        beforeEach(() => {
            const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
                'C7163972-A362-4167-8D33-77A64674B31C',
                'MyVenue'
            );
            participant = participants[0];
        });
        const trueCases = [Role.QuickLinkParticipant, Role.QuickLinkObserver];
        const allRoles = Object.values(Role);
        allRoles.forEach(role => {
            const expectation = trueCases.includes(role);
            it(`should return ${expectation} for ${role}`, () => {
                participant.role = role;
                const p = new ParticipantContactDetails(participant);
                expect(p.isQuickLinkUser).toBe(expectation);
            });
        });
    });
});
