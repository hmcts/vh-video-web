import { Observable, Subject } from 'rxjs';

export class VideoCallEventsService {
    private onVideoWrapperReadySubject = new Subject<void>();
    private onLeaveConsultationSubject = new Subject<void>();
    private onLockConsultationToggledSubject = new Subject<boolean>();
    private onChangeDeviceSubject = new Subject<void>();
    private onChangeLanguageSelectedSubject = new Subject<void>();
    private onUnreadCountUpdatedSubject = new Subject<number>();

    onVideoWrapperReady(): Observable<void> {
        return this.onVideoWrapperReadySubject.asObservable();
    }

    onLeaveConsultation(): Observable<void> {
        return this.onLeaveConsultationSubject.asObservable();
    }

    onLockConsultationToggled(): Observable<boolean> {
        return this.onLockConsultationToggledSubject.asObservable();
    }

    onChangeDevice(): Observable<void> {
        return this.onChangeDeviceSubject.asObservable();
    }

    onChangeLanguageSelected(): Observable<void> {
        return this.onChangeLanguageSelectedSubject.asObservable();
    }

    onUnreadCountUpdated(): Observable<number> {
        return this.onUnreadCountUpdatedSubject.asObservable();
    }

    triggerVideoWrapperReady() {
        this.onVideoWrapperReadySubject.next();
    }

    leaveConsultation() {
        this.onLeaveConsultationSubject.next();
    }

    toggleLockConsultation(lock: boolean) {
        this.onLockConsultationToggledSubject.next(lock);
    }

    changeDevice() {
        this.onChangeDeviceSubject.next();
    }

    changeLanguage() {
        this.onChangeLanguageSelectedSubject.next();
    }

    updateUnreadCount(count: number) {
        this.onUnreadCountUpdatedSubject.next(count);
    }
}
