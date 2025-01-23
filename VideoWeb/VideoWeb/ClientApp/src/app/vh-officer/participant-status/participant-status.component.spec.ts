import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ParticipantContactDetailsResponseVho, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { VideoWebService } from '../../services/api/video-web.service';
import { ErrorService } from '../../services/error.service';
import { ParticipantStatusReader } from '../../shared/models/participant-status-reader';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { ParticipantStatusComponent } from './participant-status.component';

describe('ParticipantStatusComponent', () => {
    const eventsService = eventsServiceSpy;
    const videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getParticipantsWithContactDetailsByConferenceId',
        'raiseSelfTestFailureEvent',
        'updateParticipantDisplayName',
        'deleteParticipant'
    ]);
    const errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', [
        'goToServiceError',
        'handleApiError',
        'returnHomeIfUnauthorised'
    ]);
    const participantStatusReaderSpy = jasmine.createSpyObj<ParticipantStatusReader>(
        'ParticipantStatusReader',
        ['getStatusAsText', 'getStatusAsTextForHost'],
        { inAnotherHearingText: 'In Another Hearing' }
    );

    let participants: ParticipantContactDetailsResponseVho[];
    let component: ParticipantStatusComponent;

    beforeEach(() => {
        participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            '174DFEFB-8EF2-4093-801D-621DF852021D',
            'MyVenue'
        );
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.returnValue(Promise.resolve(participants));

        component = new ParticipantStatusComponent(
            videoWebServiceSpy,
            errorServiceSpy,
            eventsService,
            new MockLogger(),
            participantStatusReaderSpy
        );
    });

    it('should initalise data', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(6);
        expect(component.loadingData).toBeFalsy();
    }));

    describe('sort participants', () => {
        it('should sort participants in correct order', async () => {
            const participantsToSort: ParticipantContactDetails[] = [];

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Manual Judge 26',
                        hearing_role: HearingRole.JUDGE,
                        linked_participants: [],
                        role: Role.Judge
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'JOH2',
                        hearing_role: HearingRole.PANELMEMBER,
                        linked_participants: [],
                        role: Role.JudicialOfficeHolder
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'JOH1',
                        hearing_role: HearingRole.PANEL_MEMBER,
                        linked_participants: [],
                        role: Role.JudicialOfficeHolder
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'A Staff Member',
                        hearing_role: HearingRole.STAFF_MEMBER,
                        linked_participants: [],
                        role: Role.StaffMember
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Witness 01',
                        hearing_role: HearingRole.WITNESS,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'QuickLink',
                        hearing_role: HearingRole.QUICK_LINK_PARTICIPANT,
                        linked_participants: [],
                        role: Role.QuickLinkParticipant
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Individual 01',
                        hearing_role: HearingRole.APPELLANT,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );
            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Witness 02',
                        hearing_role: HearingRole.WITNESS,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );
            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Individual 02',
                        hearing_role: HearingRole.APPELLANT,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            participantsToSort.push(
                new ParticipantContactDetails(
                    new ParticipantContactDetailsResponseVho({
                        display_name: 'Observer',
                        hearing_role: HearingRole.OBSERVER,
                        linked_participants: [],
                        role: Role.Individual
                    })
                )
            );

            component.participants = participantsToSort;

            const participantList = component.sortParticipants();

            // Judge
            const judgeIndex = participantList.findIndex(x => x.displayName === 'Manual Judge 26');
            expect(judgeIndex).toEqual(0);

            // Panel members and wingers
            const panelMember1Index = participantList.findIndex(x => x.displayName === 'JOH1');
            const panelMember2Index = participantList.findIndex(x => x.displayName === 'JOH2');
            expect(panelMember1Index).toEqual(1);
            expect(panelMember2Index).toEqual(2);

            // Staff
            const staff = participantList.findIndex(x => x.displayName === 'A Staff Member');
            expect(staff).toEqual(3);

            // Participants
            const pariticpant1 = participantList.findIndex(x => x.displayName === 'Individual 01');
            const pariticpant2 = participantList.findIndex(x => x.displayName === 'Individual 02');
            expect(pariticpant1).toEqual(4);
            expect(pariticpant2).toEqual(5);

            const witness1 = participantList.findIndex(x => x.displayName === 'Witness 01');
            const witness2 = participantList.findIndex(x => x.displayName === 'Witness 02');
            expect(witness1).toEqual(6);
            expect(witness2).toEqual(7);

            // Observers
            const observerIndex = participantList.findIndex(x => x.displayName === 'Observer');
            expect(observerIndex).toEqual(8);
            // Quicklink
            const quicklinkIndex = participantList.findIndex(x => x.displayName === 'QuickLink');
            expect(quicklinkIndex).toEqual(9);
        });
    });

    describe('Updating Participant Name Controls', () => {
        it('should set participant being edited, when edit button clicked', () => {
            const participant = new ParticipantContactDetails(participants[0]);
            component.setParticipantEdit(participant);
            expect(component.participantBeingEdited).toEqual(participant);
            expect(component.newParticipantName).toEqual(participant.displayName);
        });

        it('should set new participant display name, when text box filled in', () => {
            const newName = 'New Name';
            component.onParticipantNameChange(newName);
            expect(component.newParticipantName).toEqual(newName);
        });

        it('should cancel editing participant, when cancel button clicked', () => {
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            component.newParticipantName = 'New Name';
            component.cancelNameUpdate();
            expect(component.participantBeingEdited).toBeNull();
            expect(component.newParticipantName).toBeNull();
        });

        it('should return true when participant id matches one being edited', () => {
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            expect(component.isEditingParticipant(component.participantBeingEdited.id)).toBeTrue();
        });

        it('should update participant name, when save button clicked', () => {
            videoWebServiceSpy.updateParticipantDisplayName.and.returnValue(Promise.resolve());
            component.conferenceId = '123';
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            component.newParticipantName = 'New Name';
            component.saveNameUpdate(component.participantBeingEdited.id);
            expect(videoWebServiceSpy.updateParticipantDisplayName).toHaveBeenCalledWith(
                '123',
                component.participantBeingEdited.id,
                jasmine.any(Object)
            );
        });

        it('should log error when update participant name fails', () => {
            const error = new Error('Failed to update display-name');
            videoWebServiceSpy.updateParticipantDisplayName.and.returnValue(Promise.reject(error));
            component.conferenceId = '123';
            component.participantBeingEdited = new ParticipantContactDetails(participants[0]);
            component.newParticipantName = 'New Name';
            component.saveNameUpdate(component.participantBeingEdited.id);
            expect(videoWebServiceSpy.updateParticipantDisplayName).toHaveBeenCalled();
        });
    });
    describe('Delete quick link disconnected participant', () => {
        it('should delete participant, when delete button clicked', () => {
            videoWebServiceSpy.deleteParticipant.and.returnValue(Promise.resolve());
            component.conferenceId = '123';
            const participantQuickLinkDisconnected = new ParticipantContactDetails(participants[5]);
            component.deleteParticipant(participantQuickLinkDisconnected);
            expect(videoWebServiceSpy.deleteParticipant).toHaveBeenCalledWith('123', participantQuickLinkDisconnected.id);
        });

        it('should log error when delete quick link participant', () => {
            const error = new Error('Failed to delete participant');
            videoWebServiceSpy.deleteParticipant.and.returnValue(Promise.reject(error));
            component.conferenceId = '123';
            const participantQuickLinkDisconnected = new ParticipantContactDetails(participants[5]);
            component.deleteParticipant(participantQuickLinkDisconnected);
            expect(videoWebServiceSpy.deleteParticipant).toHaveBeenCalled();
        });
    });

    describe('isParticipantDeletable', () => {
        it('should return true if the participant is a QuickLinkParticipant and is Disconnected', () => {
            const participant = new ParticipantContactDetailsResponseVho({
                role: Role.QuickLinkParticipant,
                status: ParticipantStatus.Disconnected
            });

            expect(component.isParticipantDeletable(participant)).toBeTrue();
        });

        it('should return true if the participant is a QuickLinkObserver and is Disconnected', () => {
            const participant = new ParticipantContactDetailsResponseVho({
                role: Role.QuickLinkObserver,
                status: ParticipantStatus.Disconnected
            });

            expect(component.isParticipantDeletable(participant)).toBeTrue();
        });

        it('should return false if the participant is a QuickLinkParticipant but is not Disconnected', () => {
            const participant = new ParticipantContactDetailsResponseVho({
                role: Role.QuickLinkParticipant,
                status: ParticipantStatus.Available
            });

            expect(component.isParticipantDeletable(participant)).toBeFalse();
        });

        it('should return false if the participant is a QuickLinkObserver but is not Disconnected', () => {
            const participant = new ParticipantContactDetailsResponseVho({
                role: Role.QuickLinkObserver,
                status: ParticipantStatus.Available
            });

            expect(component.isParticipantDeletable(participant)).toBeFalse();
        });

        it('should return false if the participant role is not QuickLinkParticipant or QuickLinkObserver, even if Disconnected', () => {
            const participant = new ParticipantContactDetailsResponseVho({
                role: Role.Individual,
                status: ParticipantStatus.Disconnected
            });

            expect(component.isParticipantDeletable(participant)).toBeFalse();
        });
    });
});
