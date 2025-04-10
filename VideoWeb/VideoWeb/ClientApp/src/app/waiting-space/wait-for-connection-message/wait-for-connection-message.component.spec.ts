import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitForConnectionMessageComponent } from './wait-for-connection-message.component';

describe('WaitForConnectionMessageComponent', () => {
    let component: WaitForConnectionMessageComponent;
    let fixture: ComponentFixture<WaitForConnectionMessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [WaitForConnectionMessageComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(WaitForConnectionMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
