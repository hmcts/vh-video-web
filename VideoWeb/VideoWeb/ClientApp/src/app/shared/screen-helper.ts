export class ScreenHelper {
    enableFullScreen(fullScreen: boolean) {
        const masterContainer = document.getElementById('master-container');
        if (fullScreen) {
            masterContainer.classList.add('fullscreen');
        } else {
            masterContainer.classList.remove('fullscreen');
        }
    }
}
