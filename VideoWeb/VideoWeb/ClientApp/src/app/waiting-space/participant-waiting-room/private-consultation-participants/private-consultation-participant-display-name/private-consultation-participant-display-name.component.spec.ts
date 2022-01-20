import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateConsultationParticipantDisplayNameComponent } from './private-consultation-participant-display-name.component';

describe('PrivateConsultationParticipantDisplayNameComponent', () => {
    let component: PrivateConsultationParticipantDisplayNameComponent;
    let fixture: ComponentFixture<PrivateConsultationParticipantDisplayNameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrivateConsultationParticipantDisplayNameComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PrivateConsultationParticipantDisplayNameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return a yellow color when paricipant is in current room', () => {
        component.isInCurrentRoom = true;
        const result = component.getColor();
        expect(result).toEqual('yellow');
    });

    it('should return a white color when paricipant is not in current room but is available', () => {
        component.isInCurrentRoom = false;
        component.isAvailable = true;
        const result = component.getColor();
        expect(result).toEqual('white');
    });

    it('should return any color when paricipant is not in current room and is not available', () => {
        component.isInCurrentRoom = false;
        component.isAvailable = false;
        const result = component.getColor();
        expect(result).toEqual('');
    });
});
