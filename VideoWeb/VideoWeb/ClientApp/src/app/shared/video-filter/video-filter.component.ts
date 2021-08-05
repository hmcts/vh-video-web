import { Component } from '@angular/core';
import { BackgroundFilter } from 'src/app/services/models/background-filter';
import { VirtualBackgroundService } from 'src/app/services/virtual-background-service.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.css']
})
export class VideoFilterComponent {
    filters = BackgroundFilter;

    constructor(private vBgService: VirtualBackgroundService) {}

    backgroundChanged(e: Event) {
        const filter = BackgroundFilter[(e.target as HTMLInputElement).value];
        this.vBgService.updateFilter(filter);
    }
}
