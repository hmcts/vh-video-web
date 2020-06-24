import { ReturnUrlService } from './return-url.service';

describe('ReturnUrlService', () => {
    let service: ReturnUrlService;
    beforeEach(() => {
        service = new ReturnUrlService();
    });

    it('should return null if no key is stored', () => {
        expect(service.popUrl()).toBeNull();
    });

    it('should delete the stored url after popping', () => {
        service.setUrl('first url');
        expect(service.popUrl()).toBe('first url');
        expect(service.popUrl()).toBeNull();
    });

    it('should use the last stored url', () => {
        service.setUrl('first url');
        service.setUrl('second url');
        expect(service.popUrl()).toBe('second url');
    });
});
