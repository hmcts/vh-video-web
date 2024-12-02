import { CommandCentreMenuService } from './command-centre-menu.service';

describe('CommandCentreMenuService', () => {
    let service: CommandCentreMenuService;

    beforeEach(() => {
        service = new CommandCentreMenuService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit conference im clicked event', done => {
        service.onConferenceImClicked(() => {
            expect(true).toBe(true);
            done();
        });

        service.emitConferenceImClicked();
    });

    it('should subscribe to conference im clicked event', () => {
        const callback = jasmine.createSpy('callback');

        const subscription = service.onConferenceImClicked(callback);
        service.emitConferenceImClicked();

        expect(callback).toHaveBeenCalled();
        subscription.unsubscribe();
    });
});
