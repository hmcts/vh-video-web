import { Component } from '@angular/core';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VirtualBackgroundService } from 'src/app/services/virtual-background-service.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.css']
})
export class VideoFilterComponent {
    filters = [
        { name: 'blur', value: BackgroundFilter.blur },
        { name: 'HMCTS', value: BackgroundFilter.HMCTS },
        { name: 'SCTS', value: BackgroundFilter.SCTS }
    ];

    constructor(private vBgService: VirtualBackgroundService) {}

    backgroundChanged(e: Event) {
        console.warn('[VBG Service] filter dropdown changed ' + e);
        console.warn(e);
        console.warn(e.target);
        const filter = BackgroundFilter[(e.target as HTMLInputElement).value];
        console.warn('[VBG Service] filter dropdown changed ' + filter);
        this.vBgService.updateFilter(filter);
    }
}
