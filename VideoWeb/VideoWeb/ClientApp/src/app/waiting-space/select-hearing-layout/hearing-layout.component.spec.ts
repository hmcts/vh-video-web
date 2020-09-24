import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingLayout } from '../models/hearing-layout';

import { HearingLayoutComponent } from './hearing-layout.component';

describe('HearingLayoutComponent', () => {
    let component: HearingLayoutComponent;

    beforeEach(() => {
        component = new HearingLayoutComponent();
    });

    const getLayoutImagePathTestCases = [
        { layout: HearingLayout.Dynamic, expected: '/assets/images/layout_dynamic.png' },
        { layout: HearingLayout.OnePlus7, expected: '/assets/images/layout_1_7.png' },
        { layout: HearingLayout.TwoPlus21, expected: '/assets/images/layout_2_21.png' }
    ];

    getLayoutImagePathTestCases.forEach(test => {
        it(`should get image path ${test.expected} when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutImagePath()).toBe(test.expected);
        });
    });

    const getLayoutTitleTestCases = [
        { layout: HearingLayout.Dynamic, expected: 'Dynamic' },
        { layout: HearingLayout.OnePlus7, expected: '1 main speaker' },
        { layout: HearingLayout.TwoPlus21, expected: '2 main speakers' }
    ];

    getLayoutTitleTestCases.forEach(test => {
        it(`should get title ${test.expected} when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutTitle()).toBe(test.expected);
        });
    });

    const getLayoutDescriptionTestCases = [
        { layout: HearingLayout.Dynamic, expected: 'Layout automatically' },
        { layout: HearingLayout.OnePlus7, expected: 'Up to 7 participants on screen' },
        { layout: HearingLayout.TwoPlus21, expected: 'Up to 21 participants on screen' }
    ];

    getLayoutDescriptionTestCases.forEach(test => {
        it(`should get description when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutDescription()).toContain(test.expected);
        });
    });
});
