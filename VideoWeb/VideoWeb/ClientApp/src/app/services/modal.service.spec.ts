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
        testModal.id = 'testmodal';
        testModal.open = jasmine.createSpy('open');
        testModal.close = jasmine.createSpy('close');
    });

    it('should add modal to list', () => {
        service.add(testModal);
        expect(service.getModals()).toContain(testModal);
    });

    it('should not add modal already exists', () => {
        service.add(testModal);
        service.add(testModal);
        expect(service.getModals().length).toBe(1);
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

    it('should remove modal if exists', () => {
        service.add(testModal);
        service.remove(testModal.id);

        expect(service.getModals().length).toBe(0);
    });

    it('should not error when attempting to remove non-existent modal', () => {
        service.remove(testModal.id);
        expect(service.getModals().length).toBe(0);
    });

    it('should close all modals', () => {
        const elem = document.createElement('div');
        const elemRef = new ElementRef(elem);
        const testModal2 = new ModalComponent(service, elemRef);
        testModal2.id = 'testmodal2';
        testModal2.open = jasmine.createSpy('open');
        testModal2.close = jasmine.createSpy('close');

        service.add(testModal);
        service.add(testModal2);

        service.closeAll();
        expect(testModal.close).toHaveBeenCalled();
        expect(testModal2.close).toHaveBeenCalled();
    });
});
