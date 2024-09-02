import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewContainerRef } from '@angular/core';
import { FeatureFlagDirective } from './feature-flag.directive';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';

@Component({
    template: `
        <ng-container *appFeatureFlag="'myFlag'">
            <div>Flag is enabled</div>
        </ng-container>
    `
})
class TestComponent {}

describe('FeatureFlagDirective', () => {
    let fixture: ComponentFixture<TestComponent>;
    let launchDarklyService: jasmine.SpyObj<LaunchDarklyService>;

    beforeEach(() => {
        const launchDarklyServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['getFlag']);
        TestBed.configureTestingModule({
            declarations: [FeatureFlagDirective, TestComponent],
            providers: [{ provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }]
        });
        fixture = TestBed.createComponent(TestComponent);
        launchDarklyService = TestBed.inject(LaunchDarklyService) as jasmine.SpyObj<LaunchDarklyService>;
    });

    it('should create an instance', () => {
        const directive = new FeatureFlagDirective({} as TemplateRef<any>, {} as ViewContainerRef, launchDarklyService);
        expect(directive).toBeTruthy();
    });

    it('should create embedded view when flag is enabled', () => {
        launchDarklyService.getFlag.and.returnValue(of(true));
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector('div');
        expect(element.textContent).toContain('Flag is enabled');
    });

    it('should clear view container when flag is disabled', () => {
        launchDarklyService.getFlag.and.returnValue(of(false));
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector('div');
        expect(element).toBeNull();
    });
});
