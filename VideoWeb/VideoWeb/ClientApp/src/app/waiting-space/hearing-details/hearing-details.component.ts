import { Component, Input } from '@angular/core';
import { convertStringToTranslationId } from 'src/app/shared/translation-id-converter';
import { VHConference } from '../store/models/vh-conference';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

@Component({
    standalone: false,
    selector: 'app-hearing-details',
    templateUrl: './hearing-details.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class HearingDetailsComponent {
    @Input() conference: VHConference;
    @Input() hearing: VHHearing;

    stringToTranslateId(str: string) {
        return convertStringToTranslationId(str);
    }
}
