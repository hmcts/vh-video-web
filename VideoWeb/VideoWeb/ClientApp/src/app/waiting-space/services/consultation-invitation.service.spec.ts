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

    describe('getInvitation', () => {
        const expectedId = 'test-id';
        it('should return the existing invitation', () => {
            // Arrange
            const expectedInvitation = {} as ConsultationInvitation;
            service['consultationInvitations'][expectedId] = expectedInvitation;

            // Act
            const invitation = service.getInvitation(expectedId);

            // Assert
            expect(invitation).toEqual(expectedInvitation);
        });

        it('should create a new invitation', () => {
            // Act
            const invitation = service.getInvitation(expectedId);

            // Assert
            expect(invitation).toBeTruthy();
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
