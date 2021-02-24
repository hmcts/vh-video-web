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
    duration$: Observable<string>;
    private expiryDate: Date;

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
        this.duration$ = this.clockService.getClock().pipe(
            startWith(new Date()),
            map(date => {
                return this.calcTimeLeft(date);
            })
        );
    }

    calcTimeLeft(now: Date): string {
        const momentNow = moment(now);
        const momentExpired = moment(this.expiryDate);

        const secondsUntilExpired = moment(momentExpired).diff(momentNow, 's');
        const duration = moment.duration(secondsUntilExpired, 's');

        if (!duration) {
            return '';
        }

        const ms = duration.asMilliseconds();
        return moment.utc(ms).format('mm:ss');
    }
}
