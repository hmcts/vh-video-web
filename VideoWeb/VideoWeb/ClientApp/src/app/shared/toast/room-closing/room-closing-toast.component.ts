import * as moment from 'moment';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService, ToastPackage } from 'ngx-toastr';
import { Hearing } from '../../models/hearing';
import { Subscription } from 'rxjs';
import { VhToastComponent } from '../vh-toast.component';
import { ClockService } from 'src/app/services/clock.service';

@Component({
    templateUrl: './room-closing-toast.component.html',
    styleUrls: ['./room-closing-toast.component.scss']
})
export class RoomClosingToastComponent extends VhToastComponent implements OnInit, OnDestroy {
    durationStr: string;
    private timeLeft$: Subscription;
    private hearing: Hearing;
    private expiryTime: Date;

    constructor(protected toastrService: ToastrService, public toastPackage: ToastPackage, private clockService: ClockService) {
        super(toastrService, toastPackage);
    }

    ngOnInit(): void {
        this.timeLeft$ = this.clockService.getClock().subscribe(time => this.calcTimeLeft(time));
    }

    ngOnDestroy(): void {
        this.timeLeft$?.unsubscribe();
    }

    setHearing(hearing: Hearing) {
        this.hearing = hearing;
        this.expiryTime = this.hearing.retrieveExpiryTime();
        this.calcTimeLeft(new Date());
    }

    calcTimeLeft(now: Date): string {
        if (!this.hearing) {
            return;
        }

        const momentNow = moment(now);
        const momentExpired = moment(this.expiryTime);

        const secondsUntilExpired = moment(momentExpired).diff(momentNow, 's');
        const duration = moment.duration(secondsUntilExpired, 's');

        if (!duration) {
            this.durationStr = null;
            return;
        }

        const ms = duration.asMilliseconds();
        if (ms <= 0) {
            this.durationStr = null;
            return;
        }

        const mmss = moment.utc(ms).format('mm:ss');
        this.durationStr = mmss;
    }

    public dismiss() {
        super.remove();
    }
}
