import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivateConsultationDescriptionComponent } from './private-consultation-description.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('PrivateConsultationDescriptionComponent', () => {
    let component: PrivateConsultationDescriptionComponent;
    let fixture: ComponentFixture<PrivateConsultationDescriptionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrivateConsultationDescriptionComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(PrivateConsultationDescriptionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
