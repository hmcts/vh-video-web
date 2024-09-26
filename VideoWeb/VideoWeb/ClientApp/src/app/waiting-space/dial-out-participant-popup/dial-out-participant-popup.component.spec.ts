import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialOutParticipantPopupComponent } from './dial-out-participant-popup.component';

describe('DialOutParticipantPopupComponent', () => {
    let component: DialOutParticipantPopupComponent;
    let fixture: ComponentFixture<DialOutParticipantPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DialOutParticipantPopupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DialOutParticipantPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
