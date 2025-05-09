import { VHConference, VHParticipant, VHRoom } from 'src/app/waiting-space/store/models/vh-conference';
import { ConsultationRules } from './consultation-rules';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { ParticipantStatus, Role } from '../clients/api-client';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';

describe('ConsultationRules', () => {
    let consultationRules: ConsultationRules;
    let conference: VHConference;

    beforeEach(() => {
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailFuture());
        conference.participants = [];
        consultationRules = new ConsultationRules(conference);
    });

    describe('getParticipantsInRoom', () => {
        it('should return participants in the current room', () => {
            // Arrange
            const currentRoom = 'Room1';
            const participants: VHParticipant[] = [
                { id: '1', status: ParticipantStatus.InConsultation, room: { label: currentRoom } } as VHParticipant,
                { id: '2', status: ParticipantStatus.InConsultation, room: { label: currentRoom } } as VHParticipant,
                { id: '3', status: ParticipantStatus.InConsultation, room: { label: 'Room2' } } as VHParticipant,
                { id: '4', status: ParticipantStatus.Available } as VHParticipant,
                { id: '5', status: ParticipantStatus.NotSignedIn } as VHParticipant
            ];
            conference.participants = participants;

            // Act
            const result = consultationRules.getParticipantsInRoom(currentRoom);

            // Assert
            expect(result.length).toBe(2);
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });

        it('should return empty array when no participants are in the current room', () => {
            // Arrange
            const currentRoom = 'Room1';
            conference.participants = [];

            // Act
            const result = consultationRules.getParticipantsInRoom(currentRoom);

            // Assert
            expect(result.length).toBe(0);
        });
    });

    describe('participantsAreScreenedFromEachOther', () => {
        it('should return true when participant 1 is screened from participant 2', () => {
            // Arrange
            const participant1: VHParticipant = { externalReferenceId: '1', protectedFrom: ['2'] } as VHParticipant;
            const participant2: VHParticipant = { externalReferenceId: '2', protectedFrom: [] } as VHParticipant;

            // Act
            const result = consultationRules.participantsAreScreenedFromEachOther(participant1, participant2);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return true when participant 2 is screened from participant 2', () => {
            // Arrange
            const participant1: VHParticipant = { externalReferenceId: '1', protectedFrom: [] } as VHParticipant;
            const participant2: VHParticipant = { externalReferenceId: '2', protectedFrom: ['1'] } as VHParticipant;

            // Act
            const result = consultationRules.participantsAreScreenedFromEachOther(participant1, participant2);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false when participants are not screened from each other', () => {
            // Arrange
            const participant1: VHParticipant = { externalReferenceId: '1', protectedFrom: [] } as VHParticipant;
            const participant2: VHParticipant = { externalReferenceId: '2', protectedFrom: [] } as VHParticipant;

            // Act
            const result = consultationRules.participantsAreScreenedFromEachOther(participant1, participant2);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('participantHasInviteRestrictions', () => {
        const currentRoom = 'Room1';
        let loggedInUser: VHParticipant;
        let targetParticipant: VHParticipant;
        let participantB: VHParticipant;

        beforeEach(() => {
            loggedInUser = {
                id: '1',
                externalReferenceId: 'er-1',
                role: Role.Judge,
                hearingRole: HearingRole.JUDGE,
                status: ParticipantStatus.InConsultation,
                room: { label: currentRoom } as VHRoom
            } as VHParticipant;
            targetParticipant = {
                id: '2',
                externalReferenceId: 'er-2',
                role: Role.Individual,
                hearingRole: HearingRole.APPELLANT,
                status: ParticipantStatus.Available,
                room: { label: currentRoom } as VHRoom
            } as VHParticipant;
            participantB = {
                id: '3',
                externalReferenceId: 'participantB',
                role: Role.Individual,
                hearingRole: HearingRole.APPELLANT,
                status: ParticipantStatus.Available,
                room: { label: currentRoom } as VHRoom
            } as VHParticipant;

            conference.participants = [loggedInUser, targetParticipant, participantB];
        });

        describe('without screening', () => {
            it('should return true if user is not judical (Witness), and participant is not allowed to be invited', () => {
                // Arrange
                loggedInUser.role = Role.Individual;
                targetParticipant.hearingRole = HearingRole.WITNESS;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });

            it('should return true if user is not judical (Expert), and participant is not allowed to be invited', () => {
                // Arrange
                loggedInUser.role = Role.Individual;
                targetParticipant.hearingRole = HearingRole.EXPERT;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });

            it('should return false if user is not judicial, and participant is allowed to be invited', () => {
                // Arrange
                loggedInUser.role = Role.Individual;
                targetParticipant.hearingRole = HearingRole.APPELLANT;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeFalse();
            });

            it('should return false if user is judical', () => {
                // Arrange
                // default for this test suit is judge
                targetParticipant.role = Role.StaffMember;
                targetParticipant.hearingRole = HearingRole.STAFF_MEMBER;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeFalse();
            });
        });

        describe('with screening', () => {
            it('should return true if the target participant is screened from participant B, and participant B is present in the consultation', () => {
                // Arrange
                targetParticipant.protectedFrom = [participantB.externalReferenceId];
                participantB.status = ParticipantStatus.InConsultation;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });

            it('should return true if participant B is screened from the target participant, and participant B is present in the consultation', () => {
                // Arrange
                participantB.protectedFrom = [targetParticipant.externalReferenceId];
                participantB.status = ParticipantStatus.InConsultation;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });

            it('should return false if the target participant is screened from participant B, and participant B is not present in the consultation', () => {
                // Arrange
                targetParticipant.protectedFrom = [participantB.externalReferenceId];
                participantB.status = ParticipantStatus.Available;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeFalse();
            });

            it('should return false if participant B is screened from the target participant, and participant B is not present in the consultation', () => {
                // Arrange
                participantB.protectedFrom = [targetParticipant.externalReferenceId];
                participantB.status = ParticipantStatus.Available;

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeFalse();
            });

            it('should return true if the logged in user is screened from the target participant', () => {
                // Arrange
                loggedInUser.protectedFrom = [targetParticipant.externalReferenceId];

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });

            it('should return true if the target participant is screened from the logged in user', () => {
                // Arrange
                targetParticipant.protectedFrom = [loggedInUser.externalReferenceId];

                // Act
                const result = consultationRules.participantHasInviteRestrictions(targetParticipant, currentRoom, loggedInUser);

                // Assert
                expect(result).toBeTrue();
            });
        });
    });
});
