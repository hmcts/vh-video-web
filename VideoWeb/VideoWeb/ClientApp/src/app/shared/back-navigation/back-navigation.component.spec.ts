import { Location } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { BackNavigationComponent } from './back-navigation.component';

describe('BackNavigationComponent', () => {
    let fixture: ComponentFixture<BackNavigationComponent>;
    let component: BackNavigationComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            // provide the component-under-test and dependent service
            declarations: [BackNavigationComponent, TranslatePipeMock]
        }).compileComponents();
        fixture = TestBed.createComponent(BackNavigationComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('link', () => {
        const testLinkText = 'testLinkText';
        let linkElement: DebugElement;
        beforeEach(() => {
            component.linkText = testLinkText;
            fixture.detectChanges();
            linkElement = fixture.debugElement.query(By.css('#back-link'));
        });
        it('should have correct text', () => {
            expect(linkElement.nativeElement.textContent.trim()).toBe(testLinkText);
        });

        it('clicking should emit', fakeAsync(() => {
            spyOn(component.navigateBack, 'emit');
            linkElement.nativeElement.click();
            tick();
            expect(component.navigateBack.emit).toHaveBeenCalledTimes(1);
        }));
    });
});
