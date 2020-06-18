import { Injectable } from '@angular/core';
import { ModalComponent } from '../shared/modal/modal.component';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    private modals: ModalComponent[] = [];

    add(modal: ModalComponent) {
        // add modal to array of active modals
        if (!this.checkModalExists(modal.id)) {
            this.modals.push(modal);
        }
    }

    remove(id: string) {
        // remove modal from array of active modals
        if (this.checkModalExists(id)) {
            this.modals = this.modals.filter(x => x.id !== id);
        }
    }

    private checkModalExists(id: string): ModalComponent {
        return this.modals.find(x => x.id === id);
    }

    open(id: string) {
        // open modal specified by id
        const modal = this.checkModalExists(id);
        if (modal) {
            modal.open();
        }
    }

    close(id: string) {
        // close modal specified by id
        const modal = this.checkModalExists(id);
        if (modal) {
            modal.close();
        }
    }

    closeAll() {
        this.modals.forEach(modal => {
            modal.close();
        });
    }

    getModals(): readonly ModalComponent[] {
        return this.modals;
    }
}
