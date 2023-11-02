import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmCloseHearingPopupComponent } from './confirm-close-hearing-popup.component';

describe('ConfirmCloseHearingPopupComponent', () => {
    let component: ConfirmCloseHearingPopupComponent;
    let fixture: ComponentFixture<ConfirmCloseHearingPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmCloseHearingPopupComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmCloseHearingPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set modalDivId to confirmationDialog', () => {
        expect(component.modalDivId).toEqual('confirmationDialog');
    });
});
