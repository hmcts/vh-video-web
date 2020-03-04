export class VHODashboardHelper {
    getWidthAvailableForConference(): number {
        const listColumnElement: HTMLElement = document.getElementById('list-column');
        const listWidth = listColumnElement.offsetWidth;
        const windowWidth = window.innerWidth;
        const frameWidth = windowWidth - listWidth - 60;
        return frameWidth;
    }
}
