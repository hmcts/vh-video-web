import { Component, EventEmitter, Output } from '@angular/core';
import { SelectedUserMediaDevice } from 'src/app/shared/models/selected-user-media-device';

@Component({ selector: 'app-select-media-devices', template: '' })
export class SelectMediaDevicesStubComponent {
    @Output() cancelMediaDeviceChange = new EventEmitter();
    @Output() acceptMediaDeviceChange = new EventEmitter<SelectedUserMediaDevice>();

}
