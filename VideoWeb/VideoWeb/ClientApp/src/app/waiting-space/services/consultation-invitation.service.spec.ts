import { ConsultationInvitation, ConsultationInvitationService } from './consultation-invitation.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

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

    describe('rejectInvitation', () => {
        const expectedId = 'test-id';
        it('should set rejected to false on the invitation if it exists', () => {
            // Arrange
            const invitation = {
                rejected: false
            } as ConsultationInvitation;
            service['consultationInvitations'][expectedId] = invitation;

            // Act
            service.rejectInvitation(expectedId);

            // Assert
            expect(invitation.rejected).toBeTrue();
        });
    });

    describe('getInvitation', () => {
        const expectedId = 'test-id';
        it('should return the existing invitation', () => {
            // Arrange
            const expectedInvitation = {} as ConsultationInvitation;
            service['consultationInvitations'][expectedId] = expectedInvitation;

            // Act
            const invitation = service.getInvitation(expectedId);

            // Assert
            expect(invitation).toBe(expectedInvitation);
        });

        it('should create a new invitation if an existing one does NOT exist', () => {
            // Act
            const invitation = service.getInvitation(expectedId);

            // Assert
            expect(invitation).toBeTruthy();
        });

        it('should create a new invitation if the existing one is marked as rejected', () => {
            // Arrange
            const existingInvitation = {
                rejected: true
            } as ConsultationInvitation;
            service['consultationInvitations'][expectedId] = existingInvitation;

            // Act
            const invitation = service.getInvitation(expectedId);

            // Assert
            expect(invitation).toBeTruthy();
            expect(invitation.rejected).toBeFalse();
        });
    });

    describe('removeInvitation', () => {
        const expectedId = 'test-id';
        it('should attempt to remove the toast and delete the invitation', () => {
            // Arrange
            const expectedInvitation = {} as ConsultationInvitation;
            const expectedToastSpy = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            expectedInvitation.activeToast = expectedToastSpy;

            service['consultationInvitations'][expectedId] = expectedInvitation;

            // Act
            service.removeInvitation(expectedId);

            // Assert
            expect(expectedToastSpy.remove).toHaveBeenCalledTimes(1);
            expect(expectedInvitation.activeToast).toBeFalsy();
            expect(service['consultationInvitations'][expectedId]).toBeFalsy();
        });
    });
});
