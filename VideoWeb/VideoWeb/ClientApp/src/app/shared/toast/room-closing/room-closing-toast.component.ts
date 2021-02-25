import * as moment from 'moment';
import { Component, OnInit } from '@angular/core';
import { ToastrService, ToastPackage } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { VhToastButton, VhToastComponent } from '../vh-toast.component';
import { ClockService } from 'src/app/services/clock.service';
import { map, startWith } from 'rxjs/operators';

interface RoomClosingToastOptions {
    expiryDate: Date;
    buttons: VhToastButton[];
}
@Component({
    templateUrl: './room-closing-toast.component.html',
    styleUrls: ['../vh-toast.component.scss']
})
export class RoomClosingToastComponent extends VhToastComponent implements OnInit {
    alertMessage$: Observable<string>;
    msAllowedForPrivateConsultationsAfterClosing: number;
    expiryDate: Date;

    set roomClosingToastOptions(options: RoomClosingToastOptions) {
        this.expiryDate = options.expiryDate;
        super.vhToastOptions = {
            color: 'white',
            onNoAction: async () => {},
            buttons: options.buttons
        };
    }

    constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage, private clockService: ClockService) {
        super(toastrService, toastPackage);
    }

    ngOnInit(): void {
        this.alertMessage$ = this.clockService.getClock().pipe(
            startWith(new Date()),
            map(date => {
                return this.calcTimeLeft(date);
            })
        );
    }

    calcTimeLeft(now: Date): string {
        const milliSecondsUntilExpired = this.expiryDate.valueOf() - now.valueOf();
        if (milliSecondsUntilExpired <= 0) {
            return 'This room is closed';
        }

        const mmss = moment.utc(milliSecondsUntilExpired).format('mm:ss');
        return `This room will close in ${mmss}`;
    }
}
