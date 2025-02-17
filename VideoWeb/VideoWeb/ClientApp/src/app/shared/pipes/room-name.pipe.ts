import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    standalone: false,
    name: 'roomName',
    pure: false
})
export class RoomNamePipe implements PipeTransform {
    constructor(private translateService: TranslateService) {}

    transform(value: any, shortName: boolean = false): string {
        const meetingRoom = this.translateService.instant(`consultation-service.meeting-room${shortName ? '-short' : ''}`) + ' ';
        const judgeRoom = this.translateService.instant(`consultation-service.judge-room${shortName ? '-short' : ''}`) + ' ';

        const roomName = value
            ?.replace('ParticipantConsultationRoom', meetingRoom)
            .replace('JudgeJOHConsultationRoom', judgeRoom)
            .replace('ConsultationRoom', meetingRoom);

        return roomName ?? meetingRoom.trimEnd();
    }
}
