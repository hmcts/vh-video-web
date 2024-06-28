import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateConsultationLegalRepTermsOfServiceComponent } from './private-consultation-legal-rep-terms-of-service.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('PrivateConsultationLegalRepTermsOfServiceComponent', () => {
    let component: PrivateConsultationLegalRepTermsOfServiceComponent;
    let fixture: ComponentFixture<PrivateConsultationLegalRepTermsOfServiceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrivateConsultationLegalRepTermsOfServiceComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(PrivateConsultationLegalRepTermsOfServiceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should emit cancelled event', () => {
        const spy = spyOn(component.cancelled, 'emit');
        component.onCancel();
        expect(spy).toHaveBeenCalled();
    });

    it('should emit acknowledged event', () => {
        const spy = spyOn(component.acknowledged, 'emit');
        component.onAcknowledge();
        expect(spy).toHaveBeenCalled();
    });
});
