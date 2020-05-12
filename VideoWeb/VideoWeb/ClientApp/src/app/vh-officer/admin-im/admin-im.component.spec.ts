import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminImComponent } from './admin-im.component';

describe('AdminImComponent', () => {
    let component: AdminImComponent;
    let fixture: ComponentFixture<AdminImComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [AdminImComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminImComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
