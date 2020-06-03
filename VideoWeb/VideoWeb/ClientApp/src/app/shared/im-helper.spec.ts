import { ScreenHelper } from './screen-helper';

describe('ImHelper', () => {
    const screenhelper = new ScreenHelper();
    let masterContainerDiv: HTMLDivElement;

    beforeEach(() => {
        masterContainerDiv = document.createElement('div');
        document.getElementById = jasmine.createSpy('master-container').and.returnValue(masterContainerDiv);
    });

    it('should add fullscreen class on enable', () => {
        screenhelper.enableFullScreen(true);
        expect(masterContainerDiv.classList.contains('fullscreen')).toBeTruthy();
    });

    it('should remove fullscreen class on disable', () => {
        masterContainerDiv.classList.add('fullscreen');
        screenhelper.enableFullScreen(false);
        expect(masterContainerDiv.classList.contains('fullscreen')).toBeFalsy();
    });
});
