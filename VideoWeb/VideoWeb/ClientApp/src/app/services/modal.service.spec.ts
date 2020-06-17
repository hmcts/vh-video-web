import { ModalService } from './modal.service';

describe('ModalService', () => {
    let service: ModalService;
    let testModal: any;
    beforeEach(() => {
        service = new ModalService();
        testModal = {
            id: '1234',
            open: jasmine.createSpy('open'),
            close: jasmine.createSpy('close')
        };
    });

    it('should add modal to list', () => {
        const modal = { id: 'test123' };
        service.add(modal);
        expect(service.getModals()).toContain(modal);
    });

    it('should open modal if in list', () => {
        service.add(testModal);
        service.open(testModal.id);
        expect(testModal.open).toHaveBeenCalled();
    });

    it('should not open modal if not in list', () => {
        service.open(testModal.id);
        expect(testModal.open).toHaveBeenCalledTimes(0);
    });

    it('should close modal if in list', () => {
        service.add(testModal);
        service.close(testModal.id);
        expect(testModal.close).toHaveBeenCalled();
    });

    it('should not close modal if not in list', () => {
        service.close(testModal.id);
        expect(testModal.open).toHaveBeenCalledTimes(0);
    });
});
