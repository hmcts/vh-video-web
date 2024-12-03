import { CommandCentreMenuService } from './command-centre-menu.service';

describe('CommandCentreMenuService', () => {
    let service: CommandCentreMenuService;

    beforeEach(() => {
        service = new CommandCentreMenuService();
    });

    it('should emit conference im clicked event', done => {
        service.conferenceImClicked$.subscribe(() => {
            expect(true).toBe(true);
            done();
        });

        service.emitConferenceImClicked();
    });

    it('should subscribe to conference IM clicked event', () => {
        const callback = jasmine.createSpy('callback');

        const subscription = service.conferenceImClicked$.subscribe(callback);
        service.emitConferenceImClicked();

        expect(callback).toHaveBeenCalled();
        subscription.unsubscribe();
    });
});
