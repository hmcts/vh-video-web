import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationErrorComponent } from './consultation-error.component';
import { Subject } from 'rxjs';

describe('ConsultationErrorComponent', () => {
    let component: ConsultationErrorComponent;
    let consultationServiceSpy: jasmine.SpyObj<ConsultationService>;
    const errorMessageSubject = new Subject<string>();
    beforeEach(() => {
        consultationServiceSpy = jasmine.createSpyObj('ConsultationService', [], {
            consultationError$: errorMessageSubject.asObservable()
        });
        component = new ConsultationErrorComponent(consultationServiceSpy);
    });

    it('should emit closed modal with modal name', () => {
        spyOn(component.closedModal, 'emit');
        component.closeModal();
        expect(component.closedModal.emit).toHaveBeenCalled();
    });
});
