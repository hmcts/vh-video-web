import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantAlertComponent } from './participant-alert.component';

describe('ParticipantAlertComponent', () => {
    let component: ParticipantAlertComponent;
    let fixture: ComponentFixture<ParticipantAlertComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ParticipantAlertComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantAlertComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
