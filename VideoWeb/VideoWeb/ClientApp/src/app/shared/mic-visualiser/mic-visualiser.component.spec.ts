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

    describe('fillMeter', () => {
        let clearRectSpy: jasmine.SpyObj<any>;
        let fillRectSpy: jasmine.SpyObj<any>;
        const originalElementWidth = 100;
        const elementHeight = 30;
        const feedback = 1;

        let fillWidth: number;

        beforeEach(() => {
            canvasElement.style.width = `${originalElementWidth}px`;
            canvasElement.style.height = `${elementHeight}px`;
            clearRectSpy = spyOn(canvasContext, 'clearRect');
            fillRectSpy = spyOn(canvasContext, 'fillRect').and.callFake((x: number, y: number, width: number, height: number) => {
                fillWidth = width;
            });
        });

        afterEach(() => {
            expect(canvasContext.fillStyle).toBe(component.fillColor);
        });

        it('should clear and fill canvas with 0 width when feedback is 0', () => {
            component.fillMeter(0);

            expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
            expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, originalElementWidth, elementHeight);
            expect(canvasContext.fillRect).toHaveBeenCalledTimes(1);
            expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, 0, elementHeight);
        });

        it('should clear and fill canvas', () => {
            component.fillMeter(feedback);

            expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
            expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, originalElementWidth, elementHeight);
            expect(canvasContext.fillRect).toHaveBeenCalledTimes(1);
            expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, jasmine.any(Number), elementHeight);
            expect(fillWidth).toBeGreaterThan(0);
        });

        describe('different widths', () => {
            const difference = 10;
            let originalFillWidth: number;
            let newElementWidth: number;
            beforeEach(() => {
                component.fillMeter(feedback);
                expect(fillWidth).toBeGreaterThan(0);
                originalFillWidth = fillWidth;
                clearRectSpy.calls.reset();
                fillRectSpy.calls.reset();
            });

            it('should fill a greater value when width is greater', () => {
                newElementWidth = originalElementWidth + difference;
                canvasElement.style.width = `${newElementWidth}px`;
                component.fillMeter(feedback);

                expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
                expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, newElementWidth, elementHeight);
                expect(canvasContext.fillRect).toHaveBeenCalledTimes(1);
                expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, jasmine.any(Number), elementHeight);
                expect(fillWidth).toBeGreaterThan(originalFillWidth);
            });

            it('should fill a lower value when width is lower', () => {
                newElementWidth = originalElementWidth - difference;
                canvasElement.style.width = `${newElementWidth}px`;
                component.fillMeter(feedback);

                expect(canvasContext.clearRect).toHaveBeenCalledTimes(1);
                expect(canvasContext.clearRect).toHaveBeenCalledWith(0, 0, newElementWidth, elementHeight);
                expect(canvasContext.fillRect).toHaveBeenCalledTimes(1);
                expect(canvasContext.fillRect).toHaveBeenCalledWith(0, 0, jasmine.any(Number), elementHeight);
                expect(fillWidth).toBeLessThan(originalFillWidth);
            });
        });
    });
});
