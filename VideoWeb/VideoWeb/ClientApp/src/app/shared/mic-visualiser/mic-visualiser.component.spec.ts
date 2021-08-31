import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MicVisualiserComponent } from './mic-visualiser.component';

describe('MicVisualiserComponent', () => {
    let component: MicVisualiserComponent;
    let fixture: ComponentFixture<MicVisualiserComponent>;
    let changeDetectorSpy: jasmine.SpyObj<ChangeDetectorRef>;
    let canvasElement;
    let canvasContext;

    beforeEach(async () => {
        changeDetectorSpy = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);

        await TestBed.configureTestingModule({
            declarations: [MicVisualiserComponent],
            providers: [{ provide: ChangeDetectorRef, useValue: changeDetectorSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MicVisualiserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        canvasElement = fixture.debugElement.query(By.css('#meter')).nativeElement;
        canvasContext = canvasElement.getContext('2d');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call setupStream when there is a change', () => {
        spyOn(component, 'setupStream');
        component.ngOnChanges();
        expect(component.setupStream).toHaveBeenCalledTimes(1);
    });

    it('should setup canvas afterViewInit', () => {
        component.ngAfterViewInit();
        fixture.detectChanges();
        expect(canvasContext.fillStyle).toBe('#008000');
    });

    describe('fillMeter', () => {
        beforeEach(() => {
            spyOn(canvasContext, 'clearRect');
            spyOn(canvasContext, 'fillRect');
        });
        it('should clear and fill canvas', () => {
            component.fillMeter(1);

            expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
            expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, canvasElement.scrollWidth, canvasElement.scrollHeight);
            expect(canvasContext.fillRect).toHaveBeenCalledTimes(1);
        });
    });
});
