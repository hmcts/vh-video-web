import { ModalService } from './modal.service';
import { ModalComponent } from '../shared/modal/modal.component';
import { ElementRef } from '@angular/core';

describe('ModalService', () => {
    let service: ModalService;
    let testModal: ModalComponent;
    beforeEach(() => {
        service = new ModalService();
        const elem = document.createElement('div');
        const elemRef = new ElementRef(elem);
        testModal = new ModalComponent(service, elemRef);
        testModal.open = jasmine.createSpy('open');
        testModal.close = jasmine.createSpy('close');
    });

    it('should add modal to list', () => {
        service.add(testModal);
        expect(service.getModals()).toContain(testModal);
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
