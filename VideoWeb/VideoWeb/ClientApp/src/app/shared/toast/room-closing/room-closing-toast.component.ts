import * as moment from 'moment';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService, ToastPackage } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { VhToastButton, VhToastComponent } from '../vh-toast.component';
import { ClockService } from 'src/app/services/clock.service';

interface RoomClosingToastOptions {
    expiryDate: Date;
    buttons: VhToastButton[];
}
@Component({
    templateUrl: './room-closing-toast.component.html',
    styleUrls: ['../vh-toast.component.scss']
})
export class RoomClosingToastComponent extends VhToastComponent implements OnInit, OnDestroy {
    durationStr: string;
    timeLeft$: Subscription;
    private expiryDate: Date;

    set roomClosingToastOptions(options: RoomClosingToastOptions) {
        this.setExpiryDate(options.expiryDate);
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
        this.timeLeft$ = this.clockService.getClock().subscribe(time => this.calcTimeLeft(time));
    }

    ngOnDestroy(): void {
        this.timeLeft$?.unsubscribe();
    }

    setExpiryDate(expiryDate: Date) {
        this.expiryDate = expiryDate;
        this.calcTimeLeft(new Date());
    }

    calcTimeLeft(now: Date): string {
        const momentNow = moment(now);
        const momentExpired = moment(this.expiryDate);

        const secondsUntilExpired = moment(momentExpired).diff(momentNow, 's');
        const duration = moment.duration(secondsUntilExpired, 's');

        if (!duration) {
            this.durationStr = null;
            return;
        }

        const ms = duration.asMilliseconds();
        const mmss = moment.utc(ms).format('mm:ss');
        this.durationStr = mmss;
    }
}
