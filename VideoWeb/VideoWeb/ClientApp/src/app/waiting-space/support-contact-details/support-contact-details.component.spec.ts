import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportContactDetailsComponent } from './support-contact-details.component';

describe('SupportContactDetailsComponent', () => {
    let component: SupportContactDetailsComponent;
    let fixture: ComponentFixture<SupportContactDetailsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SupportContactDetailsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SupportContactDetailsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
