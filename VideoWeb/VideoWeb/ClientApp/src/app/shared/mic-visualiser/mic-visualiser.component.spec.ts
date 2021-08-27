import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MicVisualiserComponent } from './mic-visualiser.component';

fdescribe('MicVisualiserComponent', () => {
    let component: MicVisualiserComponent;
    let fixture: ComponentFixture<MicVisualiserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MicVisualiserComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MicVisualiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
