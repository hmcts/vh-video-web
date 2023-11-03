import { TestBed } from '@angular/core/testing';
import { FocusService } from './focus.service';

describe('FocusService', () => {
    let service: FocusService;

    beforeEach(() => {
        document.body.removeChild(document.body.firstChild);
        TestBed.configureTestingModule({
            providers: [FocusService]
        });
        service = TestBed.inject(FocusService);
    });

    it('should store the last focused element', () => {
        const element = document.createElement('input');
        document.body.appendChild(element);
        element.focus();

        service.storeFocus();

        expect(service['lastFocusedElement']).toEqual(element);
    });

    it('should restore the last focused element', () => {
        const element1 = document.createElement('input');
        const element2 = document.createElement('button');
        document.body.appendChild(element1);
        document.body.appendChild(element2);
        element1.focus();

        service.storeFocus();
        element2.focus();

        service.restoreFocus();

        expect(document.activeElement).toEqual(element1);
    });

    it('should not restore focus if no element was previously focused', () => {
        const element = document.createElement('button');
        document.body.appendChild(element);

        service.restoreFocus();

        expect(document.activeElement).not.toEqual(element);
    });
});
