import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { ContextMenuHeaderComponent } from './context-menu-header.component';

describe('ContextMenuHeaderComponent', () => {
    let component: ContextMenuHeaderComponent;
    let fixture: ComponentFixture<ContextMenuHeaderComponent>;
    let translateSpy: jasmine.Spy;
    beforeEach(async () => {
        translateSpy = jasmine.createSpy('transform').and.callThrough();
        await TestBed.configureTestingModule({
            declarations: [ContextMenuHeaderComponent, MockPipe(TranslatePipe, translateSpy)]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ContextMenuHeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('contains hearing header content when is private consultation flag is set to false', () => {
        const expectedContent = 'expected hearing header translated';
        translateSpy.withArgs('private-consultation-room-controls.hearing-controls').and.returnValue(expectedContent);
        component.isPrivateConsultation = false;

        fixture.detectChanges();

        const headerElement = fixture.debugElement.query(By.css('#context-menu-header'));

        expect(headerElement.nativeElement.textContent.trim()).toEqual(expectedContent);
    });

    it('contains consultation header content when is private consultation flag is set to true', () => {
        const expectedContent = 'expected consultation header translated';
        translateSpy.withArgs('private-consultation-room-controls.consultation-controls').and.returnValue(expectedContent);
        component.isPrivateConsultation = true;

        fixture.detectChanges();

        const headerElement = fixture.debugElement.query(By.css('#context-menu-header'));

        expect(headerElement.nativeElement.textContent.trim()).toEqual(expectedContent);
    });
});
