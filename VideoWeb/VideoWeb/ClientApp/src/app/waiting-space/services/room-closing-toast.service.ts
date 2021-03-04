import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Hearing } from 'src/app/shared/models/hearing';
import { RoomClosingToastComponent } from 'src/app/shared/toast/room-closing/room-closing-toast.component';

@Injectable()
export class RoomClosingToastrService {
    private readonly loggerPrefix = '[RoomClosingToastrService] -';

    currentToast: ActiveToast<RoomClosingToastComponent> = null;
    expiresAt: Date;

    toastsDismissed = 0;

    showFirstToastAtMins = 5;
    showSecondToastAtMins = 0.5;

    constructor(private logger: Logger, private toastr: ToastrService) {}

    /**
     * If conditions are met, show the "room closing" notification
     */
    showRoomClosingAlert(hearing: Hearing, timeNow: Date) {
        if (hearing.isClosed() && !hearing.isExpired(hearing.actualCloseTime) && !this.currentToast && this.toastsDismissed < 2) {
            const expiryTime = hearing.retrieveExpiryTime();
            if (!expiryTime) {
                return;
            }

            const msToExpiry = expiryTime.valueOf() - timeNow.valueOf();
            if (msToExpiry <= this.minsToMs(this.showFirstToastAtMins)) {
                if (this.toastsDismissed === 0) {
                    // this is the first toast
                    this.showToast(expiryTime);
                    return;
                }

                if (msToExpiry <= this.minsToMs(this.showSecondToastAtMins)) {
                    // show the second toast
                    this.showToast(expiryTime);
                }
            }
        }
    }

    protected showToast(expiryDate: Date) {
        this.logger.debug(`${this.loggerPrefix} creating 'showRoomClosingAlert' toastr notification`);

        this.currentToast = this.toastr.show('', '', {
            disableTimeOut: true,
            tapToDismiss: false,
            toastComponent: RoomClosingToastComponent
        });

        const roomClosingToast = this.currentToast.toastRef.componentInstance;
        roomClosingToast.expiryDate = expiryDate;
        roomClosingToast.dismiss.subscribe(() => this.onToastClosed());
    }

    onToastClosed(): void {
        if (this.currentToast) {
            this.toastr.remove(this.currentToast.toastId);
            this.currentToast = null;
            this.toastsDismissed++;
        }
    }

    // just for convenience
    private minsToMs(minutes: number) {
        return minutes * 60 * 1000;
    }

    /**
     * Close any/all open toasts (i.e. when user exits consultation room)
     */
    clearToasts() {
        this.onToastClosed();
    }
}
