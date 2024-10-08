import { HearingLayout } from 'src/app/services/clients/api-client';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
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
        { layout: HearingLayout.TwoPlus21, expected: '/assets/images/layout_2_21.png' },
        { layout: HearingLayout.NineEqual, expected: '/assets/images/layout_3x3.png' },
        { layout: HearingLayout.SixteenEqual, expected: '/assets/images/layout_4x4.png' },
        { layout: HearingLayout.TwentyFiveEqual, expected: '/assets/images/layout_5x5.png' }
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
        { layout: HearingLayout.TwoPlus21, expected: 'hearing-layout.title-2-plus-21' },
        { layout: HearingLayout.NineEqual, expected: 'hearing-layout.title-nine-equal' },
        { layout: HearingLayout.SixteenEqual, expected: 'hearing-layout.title-sixteen-equal' },
        { layout: HearingLayout.TwentyFiveEqual, expected: 'hearing-layout.title-twenty-five-equal' }
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
        { layout: HearingLayout.TwoPlus21, expected: 'hearing-layout.description-2-plus-21' },
        { layout: HearingLayout.NineEqual, expected: 'hearing-layout.description-nine-equal' },
        { layout: HearingLayout.SixteenEqual, expected: 'hearing-layout.description-sixteen-equal' },
        { layout: HearingLayout.TwentyFiveEqual, expected: 'hearing-layout.description-twenty-five-equal' }
    ];

    getLayoutDescriptionTestCases.forEach(test => {
        it(`should get description when layout is ${test.layout}`, () => {
            component.layout = test.layout;
            expect(component.getLayoutDescription()).toContain(test.expected);
        });
    });
    it('should emit on when layout has been selected', () => {
        spyOn(component.selectedEvent, 'emit');
        component.emitSelected();
        expect(component.selectedEvent.emit).toHaveBeenCalled();
    });
});
