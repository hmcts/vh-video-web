import { Component } from '@angular/core';
import { ToastrService, Toast, ToastPackage } from 'ngx-toastr';

interface VhToastOptions {
    color: 'white' | 'black';
    body?: string;
    htmlBody?: string;
    buttons: VhToastButton[];
    timeout: () => void;
}

interface VhToastButton {
    label: string;
    action: () => void;
}

@Component({
    selector: 'vh-toast',
    templateUrl: './vh-toast.component.html',
    styleUrls: ['./vh-toast.component.scss']
})
export class VhToastComponent extends Toast {
    vhToastOptions: VhToastOptions;

    constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage) {
        super(toastrService, toastPackage);
    }
}
