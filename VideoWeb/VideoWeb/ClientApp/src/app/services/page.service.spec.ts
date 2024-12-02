import { PageService } from './page.service';

describe('PageService', () => {
    let service: PageService;

    beforeEach(() => {
        service = new PageService();
    });

    it('should emit page refreshed event', done => {
        service.pageRefreshed$.subscribe(() => {
            expect(true).toBe(true);
            done();
        });

        service.emitPageRefreshed();
    });

    it('should subscribe to page refreshed event', () => {
        const callback = jasmine.createSpy('callback');

        const subscription = service.pageRefreshed$.subscribe(callback);
        service.emitPageRefreshed();

        expect(callback).toHaveBeenCalled();
        subscription.unsubscribe();
    });
});
