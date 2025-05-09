import { ElementRef, Renderer2 } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
    let elementRef: ElementRef<HTMLDivElement>;
    let renderer2: jasmine.SpyObj<Renderer2>;
    let deviceTypeService: jasmine.SpyObj<DeviceTypeService>;
    let directive: TooltipDirective;
    let mockElement: HTMLElement;
    let nativeElement: HTMLDivElement;

    beforeEach(() => {
        mockElement = document.createElement('span');
        nativeElement = document.createElement('div');
        nativeElement.setAttribute('appTooltip', 'appTooltip');
        renderer2 = jasmine.createSpyObj<Renderer2>('Renderer2', ['addClass', 'removeClass', 'createElement', 'appendChild', 'createText']);
        renderer2.createElement.and.returnValue(mockElement);
        renderer2.addClass.and.callFake(() => mockElement.classList.add('vh-tooltip'));
        renderer2.removeClass.and.callFake(() => mockElement.classList.remove('vh-tooltip'));
        deviceTypeService = jasmine.createSpyObj<DeviceTypeService>('DeviceTypeService', ['isDesktop']);

        elementRef = new ElementRef<HTMLDivElement>(nativeElement);
        directive = new TooltipDirective(elementRef, renderer2, deviceTypeService);
    });

    it('should return _isDesktopOnly true when set isDesktopOnly true', () => {
        // When
        directive.isDesktopOnly = true;
        // Then
        expect(directive._isDesktopOnly).toEqual(true);
    });

    it('should return _isDesktopOnly false when set isDesktopOnly false', () => {
        // When
        directive.isDesktopOnly = false;
        // Then
        expect(directive._isDesktopOnly).toEqual(false);
    });

    it('should set tooltip text', () => {
        const text = 'test';
        directive.text = text;
        expect(directive._text).toBe(text);
    });

    it('should replace old colour with new colour', () => {
        const oldColour = 'blue';
        const newColour = 'red';
        directive.tooltip = document.createElement('span');
        directive._colour = oldColour;

        directive.colour = newColour;

        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, `vh-tooltip-${oldColour}`);
        expect(renderer2.addClass).toHaveBeenCalledWith(directive.tooltip, `vh-tooltip-${newColour}`);
    });

    it('should set element text if created', () => {
        const text = 'test';
        directive.tooltip = document.createElement('span');
        directive.text = text;
        expect(directive.tooltip.innerText).toBe(text);
    });

    it('should do nothing when tooltip is not ready', () => {
        directive.tooltip = undefined;
        directive.show();
        directive.hide();
        directive.colour = 'green';

        expect(renderer2.addClass).toHaveBeenCalledTimes(0);
        expect(renderer2.removeClass).toHaveBeenCalledTimes(0);
    });

    it('should hide on destroy', () => {
        directive.tooltip = document.createElement('span');
        directive.ngOnDestroy();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should remove class hide', () => {
        directive.tooltip = document.createElement('span');
        directive.hide();
        expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
    });

    it('should add class show', () => {
        const spy = spyOn(directive, 'setParentStyles');
        directive.tooltip = document.createElement('span');
        directive.show();
        expect(renderer2.addClass).toHaveBeenCalledWith(directive.tooltip, 'vh-tooltip-show');
        expect(spy).toHaveBeenCalledWith('relative');
    });

    it('should create tooltip element', () => {
        directive.create();
        expect(directive.tooltip).toBeDefined();
        expect(directive.tooltip.classList).toContain('vh-tooltip');
    });

    it('should create and display element', () => {
        spyOn(directive, 'setParentStyles');
        directive.createAndDisplay(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).toBeDefined();
        expect(directive.tooltip.classList).toContain('vh-tooltip');
        expect(directive.setParentStyles).toHaveBeenCalledWith('relative');
    });

    it('should create tooltip if not created on mouse enter', () => {
        spyOn(directive, 'setParentStyles');
        deviceTypeService.isDesktop.and.returnValue(true);
        directive.tooltip = undefined;
        directive.onMouseEnter(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).toBeDefined();
        expect(directive.setParentStyles).toHaveBeenCalledWith('relative');
    });

    it('should create tooltip in mobile when canShowInMobile is true', () => {
        spyOn(directive, 'setParentStyles');
        directive._isDesktopOnly = false;
        directive.tooltip = undefined;
        directive.onMouseEnter(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).toBeDefined();
        expect(directive.setParentStyles).toHaveBeenCalledWith('relative');
    });

    it('should not create tooltip in mobile when canShowInMobile is false', () => {
        directive.tooltip = undefined;
        directive.onMouseEnter(new MouseEvent('mouseenter', {}));
        expect(directive.tooltip).not.toBeDefined();
    });

    it('should show and updated tooltip if already defined on mouse enter', () => {
        deviceTypeService.isDesktop.and.returnValue(true);
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = document.createElement('span');

        const event = new MouseEvent('mouseenter', { clientX: 15, clientY: 15 });
        directive.onMouseEnter(event);
        expect(directive.show).toHaveBeenCalled();
        expect(directive.updatePosition).toHaveBeenCalledWith(event);
    });

    it('should do nothing when tooltip is not created on mouse leave', () => {
        spyOn(directive, 'hide');
        directive.tooltip = undefined;
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        directive.onMouseLeave(event);
        expect(directive.hide).toHaveBeenCalledTimes(0);
    });

    it('should hide tooltip on mouse leave', () => {
        spyOn(directive, 'hide');
        directive.tooltip = document.createElement('span');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        directive.onMouseLeave(event);
        expect(directive.hide).toHaveBeenCalledTimes(1);
    });

    it('should update tooltip on mouse move', () => {
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = document.createElement('span');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: nativeElement });

        directive.onMouseMove(event);
        expect(directive.show).toHaveBeenCalled();
        expect(directive.updatePosition).toHaveBeenCalledWith(event);
    });

    it('should do nothing when tooltip is not ready on mouse move', () => {
        spyOn(directive, 'show');
        spyOn(directive, 'updatePosition');
        directive.tooltip = undefined;
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: nativeElement });

        directive.onMouseMove(event);
        expect(directive.show).toHaveBeenCalledTimes(0);
        expect(directive.updatePosition).toHaveBeenCalledTimes(0);
    });

    it('should hide tooltip when mouse move event triggered by another tooltip', () => {
        spyOn(directive, 'hide');
        const otherElement = document.createElement('div');
        otherElement.setAttribute('appTooltip', 'appTooltip');
        const event = new MouseEvent('mouseleave', { clientX: 15, clientY: 15 });
        Object.defineProperty(event, 'target', { value: otherElement });
        directive.onMouseMove(event);
        expect(directive.hide).toHaveBeenCalledTimes(1);
    });
    describe('updatePosition', () => {
        let mouseEvent: MouseEvent;

        const windowHeight = 1000;
        const windowWidth = 100;

        const toolTipWidth = 10;
        const toolTipHeight = 10;

        let x: number;
        let y: number;

        beforeEach(() => {
            spyOnProperty(window, 'innerHeight').and.returnValue(windowHeight);
            spyOnProperty(window, 'innerWidth').and.returnValue(windowWidth);
            directive._text = 'test';
            const tooltip = renderer2.createElement('div');
            spyOnProperty(tooltip, 'clientHeight').and.returnValue(toolTipHeight);
            spyOnProperty(tooltip, 'clientWidth').and.returnValue(toolTipWidth);
            directive.tooltip = tooltip;
        });

        describe('x position', () => {
            beforeEach(() => {
                y = windowHeight / 2;
            });
            it('should appear to the left of the mouse when on the right half of the screen', () => {
                x = windowWidth / 2 + 1;

                mouseEvent = createMouseEvent(x, y);
                directive.updatePosition(mouseEvent);

                expect(parseInt(directive.tooltip.style.left, 10)).toBeLessThan(x);
            });

            it('should appear to the right of the mouse when on the left half of the screen', () => {
                x = windowWidth / 2 - 1;

                mouseEvent = createMouseEvent(x, y);
                directive.updatePosition(mouseEvent);

                expect(parseInt(directive.tooltip.style.left, 10)).toBeGreaterThan(x);
            });
        });

        describe('y position', () => {
            beforeEach(() => {
                x = windowWidth / 2;
            });
            it('should appear below the mouse when on the top half of the screen', () => {
                y = windowHeight / 2 - 1;

                mouseEvent = createMouseEvent(x, y);
                directive.updatePosition(mouseEvent);

                expect(parseInt(directive.tooltip.style.top, 10)).toBeGreaterThanOrEqual(y);
            });

            it('should appear above the mouse when on the bottom half of the screen', () => {
                y = windowHeight / 2 + 1;

                mouseEvent = createMouseEvent(x, y);
                directive.updatePosition(mouseEvent);

                expect(parseInt(directive.tooltip.style.top, 10)).toBeLessThan(y);
            });
        });

        describe('removeTooltips', () => {
            it('should remove tooltips when exist', () => {
                // Given
                directive.create();

                // When
                directive.removeTooltips('vh-tooltip');

                // Then
                expect(directive._tooltipElements).toBeDefined();
                expect(directive._tooltipElements[0]).toBeUndefined();
                expect(directive._tooltipElements[0]?.parentNode).toBeUndefined();
                expect(directive._tooltipElements[0]?.innerHTML).toBeUndefined();
            });

            it('should not remove tooltips if not exist', () => {
                // Given
                directive.tooltip = undefined;

                // When
                directive.removeTooltips('vh-tooltip');

                // Then
                expect(directive.tooltip).toBeUndefined();
            });

            it('should remove all the elements with vh-tooltip class from body', () => {
                // Given
                directive.tooltip = document.createElement('div');
                directive.tooltip.setAttribute('class', 'vh-tooltip');
                document.body.appendChild(directive.tooltip);

                // When
                directive.removeTooltips('vh-tooltip');

                // Then
                expect(document.getElementsByClassName('vh-tooltip')[0]).toBeUndefined();
                expect(document.getElementsByClassName('vh-tooltip')[0]?.innerHTML).toBeUndefined();
            });
        });

        describe('Keyboard Event', () => {
            const mockHTMLElement = (): FocusEvent => {
                const otherElement = document.createElement('div');
                otherElement.setAttribute('appTooltip', 'appTooltip');
                const event = new FocusEvent('focus');
                Object.defineProperty(event, 'target', { value: otherElement });
                (<HTMLElement>event.target).id = 'toggle-participants-panel';

                return event;
            };
            it('should create and display element', () => {
                // Given
                const spy = spyOn(directive, 'setTooltipPosition');
                // When
                directive.createTooltipKeyEvent(mockHTMLElement());
                // Then
                expect(spy).toHaveBeenCalled();
                expect(directive.tooltipKeyTab).toBeDefined();
                expect(directive.tooltipKeyTab.classList).toContain('vh-tooltip');
            });

            it('should set tooltip position', () => {
                // Given
                const spy = spyOn(directive, 'setParentStyles');
                // When
                directive.createTooltipKeyEvent(mockHTMLElement());
                // Then
                expect(spy).toHaveBeenCalledWith('relative', '1');
                expect(directive.tooltipKeyTab.style.top).toEqual(35 + 'px');
                expect(directive.tooltipKeyTab.style.left).toEqual('0px');
                expect(directive.tooltipKeyTab.style.opacity).toEqual('1');
            });

            it('should hide on destroy', () => {
                // Given
                spyOn(directive, 'hideTooltipKeyEvent');
                directive.tooltipKeyTab = document.createElement('span');
                // When
                directive.ngOnDestroy();
                // Then
                expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltipKeyTab, 'vh-tooltip-show');
                expect(directive.hideTooltipKeyEvent).toHaveBeenCalled();
            });

            it('should remove class hide', () => {
                // Given
                directive.tooltipKeyTab = document.createElement('span');
                const spySetParentStyles = spyOn(directive, 'setParentStyles');
                // When
                directive.hideTooltipKeyEvent();
                // Then
                expect(spySetParentStyles).toHaveBeenCalledWith('relative', '0.5');
                expect(renderer2.removeClass).toHaveBeenCalledWith(directive.tooltipKeyTab, 'vh-tooltip-show');
            });

            it('should add class show when tooltip exists', () => {
                // Given
                spyOn(directive, 'setParentStyles');
                directive.tooltipKeyTab = document.createElement('span');
                // When
                directive.showTooltipKeyEvent();
                // Then
                expect(directive.setParentStyles).toHaveBeenCalled();
                expect(renderer2.addClass).toHaveBeenCalledWith(directive.tooltipKeyTab, 'vh-tooltip-show');
            });

            it('should not add class show when tooltip do not exists', () => {
                // Given
                directive.tooltipKeyTab = undefined;
                // When
                directive.showTooltipKeyEvent();
                // Then
                expect(renderer2.addClass).not.toHaveBeenCalledWith(directive.tooltipKeyTab, 'vh-tooltip-show');
            });

            it('should create and display tooltip on key down event', () => {
                // Given
                const event = new FocusEvent('focus');
                directive.tooltipKeyTab = undefined;
                const spyCreateTooltip = spyOn(directive, 'createTooltipKeyEvent');
                const spyShowTooltip = spyOn(directive, 'showTooltipKeyEvent');
                // When
                directive.onKeyDown(event);
                // Then
                expect(spyCreateTooltip).toHaveBeenCalled();
                expect(spyShowTooltip).toHaveBeenCalled();
            });

            it('should not create new tooltip on key down event when it exists', () => {
                // Given
                const event = new FocusEvent('focus');
                directive.tooltipKeyTab = document.createElement('span');
                const spyCreateTooltip = spyOn(directive, 'createTooltipKeyEvent');
                const spyShowTooltip = spyOn(directive, 'showTooltipKeyEvent');
                // When
                directive.onKeyDown(event);
                // Then
                expect(spyCreateTooltip).not.toHaveBeenCalled();
                expect(spyShowTooltip).toHaveBeenCalled();
            });

            it('should hide tooltip on key up event', () => {
                // Given
                directive.tooltipKeyTab = document.createElement('span');
                const spyHideTooltip = spyOn(directive, 'hideTooltipKeyEvent');
                // When
                directive.onKeyUp();
                // Then
                expect(spyHideTooltip).toHaveBeenCalled();
            });

            it('should set tooltip text on key up event', () => {
                // Given
                directive.tooltipKeyTab = document.createElement('span');
                // When
                directive.setTooltipTextKeyTab();
                // Then
                expect(directive.tooltipKeyTab.innerHTML).toContain('test');
            });

            it('should hide tooltip on key up event', () => {
                // Given
                directive.tooltipKeyTab = document.createElement('span');
                const spy = spyOn(directive, 'hideTooltipKeyEvent');
                // When
                directive.onKeyUp();
                // Then
                expect(spy).toHaveBeenCalled();
            });

            it('should not hide tooltip when not on key up event', () => {
                // Given
                directive.tooltipKeyTab = undefined;
                const spy = spyOn(directive, 'hideTooltipKeyEvent');
                // When
                directive.onKeyUp();
                // Then
                expect(spy).not.toHaveBeenCalled();
            });

            it('should set element text if created', () => {
                // Given
                const text = 'test';
                directive.tooltipKeyTab = document.createElement('span');
                // When
                directive.text = text;
                // Then
                expect(directive.tooltipKeyTab.innerText).toBe(text);
            });

            it('should reset parent elemenet position to relative', () => {
                // Given
                directive.tooltipKeyTab = document.createElement('span');
                const wrapper = document.createElement('div');
                wrapper.appendChild(directive.tooltipKeyTab);
                // When
                directive.setParentStyles('relative', '1');
                // Then
                expect((<HTMLElement>directive.tooltipKeyTab.parentNode).getAttribute('style')).toEqual('position:relative;opacity:1');
            });
        });
    });
});

function createMouseEvent(x: number, y: number): MouseEvent {
    const eventInit: MouseEventInit = { clientX: x, clientY: y };
    return new MouseEvent('mouseover', eventInit);
}
