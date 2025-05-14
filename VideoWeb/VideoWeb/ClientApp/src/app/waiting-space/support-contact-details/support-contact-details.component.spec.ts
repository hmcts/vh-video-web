import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportContactDetailsComponent } from './support-contact-details.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('SupportContactDetailsComponent', () => {
    let component: SupportContactDetailsComponent;
    let fixture: ComponentFixture<SupportContactDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SupportContactDetailsComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(SupportContactDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
