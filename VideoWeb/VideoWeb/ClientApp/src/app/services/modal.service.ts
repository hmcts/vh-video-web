import { Injectable } from '@angular/core';
import { ModalComponent } from '../shared/modal/modal.component';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private modals: ModalComponent[] = [];

    add(modal: ModalComponent) {
        // add modal to array of active modals
        this.modals.push(modal);
    }

    remove(id: string) {
        // remove modal from array of active modals
        this.modals = this.modals.filter(x => x.id !== id);
    }

    open(id: string) {
        // open modal specified by id
        const modal: any = this.modals.filter(x => x.id === id)[0];
        if (modal) {
            modal.open();
        }
    }

    close(id: string) {
        // close modal specified by id
        const modal: any = this.modals.filter(x => x.id === id)[0];
        if (modal) {
            modal.close();
        }
    }

    closeAll() {
        this.modals.forEach(modal => {
            this.close(modal.id);
        });
    }

    getModals(): readonly ModalComponent[] {
        return this.modals;
    }
}
