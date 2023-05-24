import { Component, HostBinding } from '@angular/core';
import { ToastrService, Toast, ToastPackage } from 'ngx-toastr';

export interface VhToastOptions {
    color: 'white' | 'black';
    body?: string;
    htmlBody?: string;
    buttons: VhToastButton[];
    onNoAction?: () => void;
    onRemove?: () => void;
}

export interface VhToastButton {
    label: string;
    id: string;
    cssClass?: 'red' | 'green' | 'hearing-started-dismiss' | 'hearing-started-join-hearing';
    action: () => void;
}

@Component({
    selector: 'vh-toast',
    templateUrl: './vh-toast.component.html',
    styleUrls: ['./vh-toast.component.scss']
})
export class VhToastComponent extends Toast {
    vhToastOptions: VhToastOptions;
    actioned = false;
    declinedByThirdParty = false;

    constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
        super(toastrService, toastPackage);
    }

    @HostBinding('class.black') get black() {
        return this.vhToastOptions.color === 'black';
    }
    @HostBinding('class.white') get white() {
        return this.vhToastOptions.color === 'white';
    }

    remove() {
        if (!this.actioned && !this.declinedByThirdParty && this.vhToastOptions.onNoAction) {
            this.vhToastOptions.onNoAction();
        }

        if (this.vhToastOptions.onRemove) {
            this.vhToastOptions.onRemove();
        }

        super.remove();
    }

    handleAction(fn: () => void) {
        this.actioned = true;
        fn();
        this.remove();
    }
}
