import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { DesktopOnlyDirective } from './desktop-only.directive';

@Component({
    template: '<div *appDesktopOnly>Desktop Content</div>'
})
class TestComponent {}

describe('DesktopOnlyDirective', () => {
    let fixture: ComponentFixture<TestComponent>;
    let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;

    beforeEach(() => {
        deviceTypeService = jasmine.createSpyObj<DeviceTypeService>(['isDesktop']);

        TestBed.configureTestingModule({
            declarations: [DesktopOnlyDirective, TestComponent],
            providers: [{ provide: DeviceTypeService, useValue: deviceTypeService }]
        });
    });

    describe('isDesktop true', () => {
        beforeEach(() => {
            deviceTypeService.isDesktop.and.returnValue(true);
            fixture = TestBed.createComponent(TestComponent);
        });

        it('should display content', () => {
            fixture.detectChanges();
            const content = fixture.debugElement.query(By.css('div'));
            expect(content).toBeTruthy();
        });
    });

    describe('isDesktop false', () => {
        beforeEach(() => {
            deviceTypeService.isDesktop.and.returnValue(false);
            fixture = TestBed.createComponent(TestComponent);
        });

        it('should not display content', () => {
            fixture.detectChanges();
            const content = fixture.debugElement.query(By.css('div'));
            expect(content).toBeNull();
        });
    });
});
