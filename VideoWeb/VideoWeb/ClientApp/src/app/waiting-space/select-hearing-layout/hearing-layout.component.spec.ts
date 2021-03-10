import { HearingLayout } from 'src/app/services/clients/api-client';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';
import { HearingLayoutComponent } from './hearing-layout.component';

describe('HearingLayoutComponent', () => {
    let component: HearingLayoutComponent;
    const translateService = translateServiceSpy;
    
    beforeEach(() => {
        component = new HearingLayoutComponent(translateService);
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
        { layout: HearingLayout.Dynamic, expected: 'hearing-layout.title-dynamic' },
        { layout: HearingLayout.OnePlus7, expected: 'hearing-layout.title-1-plus-7' },
        { layout: HearingLayout.TwoPlus21, expected: 'hearing-layout.title-2-plus-21' }
    ];

    getLayoutTitleTestCases.forEach(test => {
        it(`should get title ${test.expected} when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutTitle()).toBe(test.expected);
        });
    });

    const getLayoutDescriptionTestCases = [
        { layout: HearingLayout.Dynamic, expected: 'hearing-layout.description-dynamic' },
        { layout: HearingLayout.OnePlus7, expected: 'hearing-layout.description-1-plus-7' },
        { layout: HearingLayout.TwoPlus21, expected: 'hearing-layout.description-2-plus-21' }
    ];

    getLayoutDescriptionTestCases.forEach(test => {
        it(`should get description when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutDescription()).toContain(test.expected);
        });
    });
});
