import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
    selector: '[appRoomName]'
})
export class RoomNameDirective implements OnInit, OnDestroy {
    @Input() roomLabel: string;
    @Input() shortName = false;
    private destroyed$ = new Subject();

    constructor(private translateService: TranslateService, private element: ElementRef, private renderer2: Renderer2) {}

    ngOnInit(): void {
        this.setElement();
        this.translateService.onLangChange.pipe(takeUntil(this.destroyed$)).subscribe(x => {
            this.setElement();
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    setElement(): void {
        this.renderer2.setProperty(this.element.nativeElement, 'innerHTML', this.getText());
    }

    getText(): string {
        const meetingRoom = this.translateService.instant(`consultation-service.meeting-room${this.shortName ? '-short' : ''}`) + ' ';
        const judgeRoom = this.translateService.instant(`consultation-service.judge-room${this.shortName ? '-short' : ''}`) + ' ';

        const roomName = this.roomLabel
            ?.replace('ParticipantConsultationRoom', meetingRoom)
            .replace('JudgeJOHConsultationRoom', judgeRoom)
            .replace('ConsultationRoom', meetingRoom);
        return roomName ?? meetingRoom.trimEnd();
    }
}
