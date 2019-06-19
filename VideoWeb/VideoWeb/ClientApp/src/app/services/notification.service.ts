import { Injectable } from '@angular/core';
import { SnotifyService, SnotifyPosition, SnotifyButton } from 'ng-snotify';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private snotifyService: SnotifyService
  ) { }

  info(message: string, timeout?: number, closeOnClick?: boolean) {
    this.snotifyService.info(message, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: timeout,
      closeOnClick: closeOnClick
    });
  }

  confirm(message: string, buttons: SnotifyButton[], timeout?: number, closeOnClick?: boolean) {
    this.snotifyService.info(message, {
      position: SnotifyPosition.rightTop,
      showProgressBar: true,
      closeOnClick: closeOnClick,
      titleMaxLength: 150,
      timeout: timeout,
      buttons: buttons
    });
  }

  success(message: string, timeout?: number, closeOnClick?: boolean) {
    this.snotifyService.info(message, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: timeout,
      closeOnClick: closeOnClick,
      titleMaxLength: 50,
    });
  }

  error(message: string, timeout?: number) {
    this.snotifyService.error(message, {
      position: SnotifyPosition.rightTop,
      showProgressBar: false,
      timeout: timeout,
      titleMaxLength: 50
    });
  }

  clearNotification(notificationId: number) {
    this.snotifyService.remove(notificationId);
  }
}
