import { Component } from '@angular/core';
import { BackgroundEffect } from 'src/app/services/models/background-effect';
import { VirtualBackgroundService } from 'src/app/services/virtual-background-service.service';

@Component({
    selector: 'app-video-filter',
    templateUrl: './video-filter.component.html',
    styleUrls: ['./video-filter.component.css']
})
export class VideoFilterComponent {
    filters = BackgroundEffect;

    constructor(private vBgService: VirtualBackgroundService) {}

    backgroundChanged(e: Event) {
        const filter = BackgroundEffect[(e.target as HTMLInputElement).value];
        this.vBgService.updateFilter(filter);
    }
}
