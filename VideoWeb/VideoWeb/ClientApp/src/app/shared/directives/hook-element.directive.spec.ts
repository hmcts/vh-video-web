import { HookElementDirective } from './hook-element.directive';

describe('HookElement', () => {
    let directive: HookElementDirective;

    beforeEach(() => {
        directive = new HookElementDirective();
    });

    it('videoContainer', () => {
        directive.readyElm = 'videoContainer';
        directive.ngOnInit();
        expect(directive.videoContainerReady).toBe(false);
    });

    it('overflowDiv', () => {
        directive.readyElm = 'overflowDiv';
        directive.ngOnInit();
        expect(directive.overflowDivReady).toBe(false);
    });

    it('participantDiv', () => {
        directive.readyElm = 'participantDiv';
        directive.ngOnInit();
        expect(directive.participantDivReady).toBe(false);
    });
});
