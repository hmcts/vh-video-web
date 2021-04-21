import { ConsultationInvitation, ConsultationInvitationService } from './consultation-invitation.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

describe('ConsultationInvitation', () => {
    let model: ConsultationInvitation;

    beforeEach(() => {
      model = new ConsultationInvitation();
    });

    it('should be created', () => {
      expect(model).toBeTruthy();
    });

    it('should add a participant to the list with a value of false if the participant doesn\'t exist', () => {
        // Arrange
        const expectedId = 'test-id';

        const expectedStatuses = {};
        expectedStatuses[expectedId] = false;

        // Act
        model.addLinkedParticipant(expectedId);

        // Assert
        expect(model.linkedParticipantStatuses).toEqual(expectedStatuses);
    });

    it('should NOT change the status of a participant if it already exists', () => {
        // Arrange
        const expectedId = 'test-id';

        const existingStatuses = {};
        existingStatuses[expectedId] = true;

        model['_linkedParticipantStatuses'] = existingStatuses;

        // Act
        model.addLinkedParticipant(expectedId);

        // Assert
        expect(model.linkedParticipantStatuses).toEqual(existingStatuses);
    });

    it('should update the status of a participant if it already exists to false when false is passed in', () => {
        // Arrange
        const expectedId = 'test-id';

        const existingStatuses = {};
        existingStatuses[expectedId] = true;

        model['_linkedParticipantStatuses'] = existingStatuses;

        // Act
        model.updateLinkedParticipantStatus(expectedId, false);

        // Assert
        expect(model.linkedParticipantStatuses[expectedId]).toBeFalse();
    });

    it('should update the status of a participant if it already exists to true when true is passed in', () => {
        // Arrange
        const expectedId = 'test-id';

        const existingStatuses = {};
        existingStatuses[expectedId] = false;

        model['_linkedParticipantStatuses'] = existingStatuses;

        // Act
        model.updateLinkedParticipantStatus(expectedId, true);

        // Assert
        expect(model.linkedParticipantStatuses[expectedId]).toBeTrue();
    });

    it('should do add the participant with the passed value (true) if the participant does NOT exist', () => {
        // Arrange
        const expectedId = 'test-id';

        const existingStatuses = {};

        model['_linkedParticipantStatuses'] = existingStatuses;

        // Act
        model.updateLinkedParticipantStatus(expectedId, true);

        // Assert
        expect(model.linkedParticipantStatuses[expectedId]).toBeTrue();
    });

    it('should do add the participant with the passed value (false) if the participant does NOT exist', () => {
        // Arrange
        const expectedId = 'test-id';

        const existingStatuses = {};

        model['_linkedParticipantStatuses'] = existingStatuses;

        // Act
        model.updateLinkedParticipantStatus(expectedId, false);

        // Assert
        expect(model.linkedParticipantStatuses[expectedId]).toBeFalse();
    });
  });


describe('ConsultationInvitationServiceService', () => {
  let service: ConsultationInvitationService;

  function spyPropertyGetter<T, K extends keyof T>(spyObj: jasmine.SpyObj<T>, propName: K): jasmine.Spy<() => T[K]> {
    return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
  }

  beforeEach(() => {
    service = new ConsultationInvitationService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInvitation', () => {
      const expectedId = 'test-id';
      it('should return the existing invitation', () => {
        // Arrange
        const expectedInvitation = jasmine.createSpyObj<ConsultationInvitation>('ConsultationInvitation', ['addLinkedParticipant']);
        service['consultationInvitations'] = {};
        service['consultationInvitations'][expectedId] = expectedInvitation;

        // Act
        const invitation = service.getInvitation(expectedId);

        // Assert
        expect(invitation).toEqual(expectedInvitation);
      });

      it('should create a new invitation', () => {
        // Arrange
        const expectedInvitation = jasmine.createSpyObj<ConsultationInvitation>('ConsultationInvitation', ['addLinkedParticipant']);
        service['consultationInvitations'] = {};
        spyOn(service, 'createInvitation').and.returnValue(expectedInvitation);

        // Act
        const invitation = service.getInvitation(expectedId);

        // Assert
        expect(service.createInvitation).toHaveBeenCalledOnceWith(expectedId);
        expect(invitation).toEqual(expectedInvitation);
      });
  });

  describe('createInvitation', () => {
    const expectedRoomlabel = 'consultation room';
    const expectedInvitedBy = 'invited by';

    it('should return the existing toast one already exists', () => {
        // Arrange
        const existingInvitation = new ConsultationInvitation();
        service['consultationInvitations'] = {};
        service['consultationInvitations'][expectedRoomlabel] = existingInvitation;

        // Act
        const invitation = service.createInvitation(expectedRoomlabel);

        // Assert
        expect(invitation).toBeTruthy();
        expect(service['consultationInvitations'][expectedRoomlabel]).toBe(invitation);
        expect(invitation.invitedByName).toBeNull();
    });

    it('should update the invited by name if one was provided', () => {
        // Arrange
        const existingInvitation = new ConsultationInvitation();
        service['consultationInvitations'] = {};
        service['consultationInvitations'][expectedRoomlabel] = existingInvitation;

        // Act
        const invitation = service.createInvitation(expectedRoomlabel, expectedInvitedBy);

        // Assert
        expect(invitation).toBeTruthy();
        expect(service['consultationInvitations'][expectedRoomlabel]).toBe(invitation);
        expect(invitation.invitedByName).toBe(expectedInvitedBy);
    });

    it('should NOT update the invited by name if one was NOT provided', () => {
        // Arrange
        const existingInvitation = new ConsultationInvitation();
        existingInvitation.invitedByName = expectedInvitedBy;
        service['consultationInvitations'] = {};
        service['consultationInvitations'][expectedRoomlabel] = existingInvitation;

        // Act
        const invitation = service.createInvitation(expectedRoomlabel);

        // Assert
        expect(invitation).toBeTruthy();
        expect(service['consultationInvitations'][expectedRoomlabel]).toBe(invitation);
        expect(invitation.invitedByName).toBe(expectedInvitedBy);
    });

    it('should create a new toast if one exists', () => {
        // Arrange
        service['consultationInvitations'] = {};

        // Act
        const invitation = service.createInvitation(expectedRoomlabel, expectedInvitedBy);

        // Assert
        expect(invitation).toBeTruthy();
        expect(service['consultationInvitations'][expectedRoomlabel]).toBe(invitation);
    });
  });

  describe('removeInvitation', () => {
    const expectedId = 'test-id';
    it('should attempt to remove the toast and delete the invitation', () => {
      // Arrange
      const expectedInvitation = jasmine.createSpyObj<ConsultationInvitation>('ConsultationInvitation', ['addLinkedParticipant'], ['activeToast']);
      const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
      spyPropertyGetter(expectedInvitation, 'activeToast').and.returnValue(expectedToastSpy);

      service['consultationInvitations'] = {};
      service['consultationInvitations'][expectedId] = expectedInvitation;

      // Act
      const invitation = service.removeInvitation(expectedId);

      // Assert
      expect(expectedToastSpy.remove).toHaveBeenCalledTimes(1);
      expect(service['consultationInvitations'][expectedId]).toBeFalsy();
    });
  });
});
