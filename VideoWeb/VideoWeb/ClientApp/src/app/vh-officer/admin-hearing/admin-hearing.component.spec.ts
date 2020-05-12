import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminHearingComponent } from './admin-hearing.component';

describe('AdminHearingComponent', () => {
    let component: AdminHearingComponent;
    let fixture: ComponentFixture<AdminHearingComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdminHearingComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminHearingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
