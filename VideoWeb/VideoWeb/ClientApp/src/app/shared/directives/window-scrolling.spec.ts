import { WindowScrolling } from './window-scrolling';
import { TestBed } from '@angular/core/testing';

describe('WindowScroll', () => {
    let scroll: WindowScrolling;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                WindowScrolling
            ]
        }).compileComponents();

        scroll = TestBed.get(WindowScrolling);
    });

    it('can return scroll position', () => {
        expect(scroll.getPosition()).toBeGreaterThanOrEqual(0);
    });

    it('can return document size', () => {
        expect(scroll.getWindowHeight()).toBeGreaterThan(0);
    });

    it('can calculate screen bottom', () => {
        expect(scroll.getScreenBottom()).toBeGreaterThanOrEqual(scroll.getWindowHeight());
        expect(scroll.getScreenBottom()).toBeGreaterThan(scroll.getPosition());
    });
});
