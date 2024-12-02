import { PageService } from './page.service';

describe('PageService', () => {
    let service: PageService;

    beforeEach(() => {
        service = new PageService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit page refreshed event', done => {
        service.onPageRefreshed(() => {
            expect(true).toBe(true);
            done();
        });

        service.emitPageRefreshed();
    });

    it('should subscribe to page refreshed event', () => {
        const callback = jasmine.createSpy('callback');

        const subscription = service.onPageRefreshed(callback);
        service.emitPageRefreshed();

        expect(callback).toHaveBeenCalled();
        subscription.unsubscribe();
    });
});
