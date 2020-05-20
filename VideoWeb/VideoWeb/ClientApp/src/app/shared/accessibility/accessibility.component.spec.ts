import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessibilityComponent } from './accessibility.component';
import { ScrolledEvent, ScrolledFooter } from '../models/scrolled-event';

describe('AccessibilityComponent', () => {
    let component: AccessibilityComponent;

    beforeEach(async(() => {
        component = new AccessibilityComponent();
    }));

    it('should go to div by id', () => {
        const id = 'chat-list';
        const mockedDocElement = document.createElement('div');
        const elemSpy = spyOn(mockedDocElement, 'scrollIntoView');
        document.getElementById = jasmine.createSpy('chat-list').and.returnValue(mockedDocElement);

        component.goToDiv(id);
        expect(elemSpy).toHaveBeenCalled();
    });

    it('should update visible contents on scroll', () => {
        const event = new ScrolledEvent(true);
        component.scrollHandler(event);
        expect(component.isVisibleContents).toBeTruthy();
    });

    it('should update is footer on scroll', () => {
        const event = new ScrolledFooter(true);
        component.scrollFooter(event);
        expect(component.scrollFooter).toBeTruthy();
    });
});
