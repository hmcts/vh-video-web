import * as moment from 'moment';
import { Component, OnInit } from '@angular/core';
import { ToastrService, ToastPackage, Toast } from 'ngx-toastr';
import { Observable, Subject } from 'rxjs';
import { ClockService } from 'src/app/services/clock.service';
import { map, startWith } from 'rxjs/operators';

@Component({
    templateUrl: './room-closing-toast.component.html',
    styleUrls: ['./room-closing-toast.component.scss']
})
export class RoomClosingToastComponent extends Toast implements OnInit {
    alertMessage$: Observable<string>;
    msAllowedForPrivateConsultationsAfterClosing: number;
    expiryDate: Date;

    dismiss = new Subject<any>();

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
