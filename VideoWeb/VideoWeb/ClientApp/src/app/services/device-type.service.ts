import { Injectable } from '@angular/core';
import { DeviceDetectorService, OS } from 'ngx-device-detector';
import { browsers } from '../shared/browser.constants';

@Injectable({
    providedIn: 'root'
})
export class DeviceTypeService {
    constructor(private deviceDetectorService: DeviceDetectorService) {}

    isMobile(): boolean {
        return this.deviceDetectorService.isMobile();
    }

    isTablet(): boolean {
        return this.deviceDetectorService.isTablet();
    }

    isDesktop(): boolean {
        return this.deviceDetectorService.isDesktop();
    }

    isIpad(): boolean {
        return this.deviceDetectorService.isTablet() && this.isIOS();
    }

    isIphone(): boolean {
        return this.deviceDetectorService.isMobile() && this.isIOS();
    }

    isIOS(): boolean {
        return (
            this.deviceDetectorService.os.toLowerCase() === OS.MAC.toLowerCase() ||
            this.deviceDetectorService.os.toLowerCase() === OS.IOS.toLowerCase()
        );
    }

    isAndroid(): boolean {
        return this.deviceDetectorService.os.toLowerCase() === OS.ANDROID.toLowerCase();
    }

    isHandheldIOSDevice(): boolean {
        return this.isIphone() || this.isIpad();
    }

    isSupportedBrowser(): boolean {
        const supportedBrowsers = [
            browsers.Firefox,
            browsers.Safari,
            browsers.Chrome,
            browsers.MSEdge,
            browsers.MSEdgeChromium,
            browsers.Samsung
        ];
        const browser = this.deviceDetectorService.browser;
        const supportedIOSBrowsers = [browsers.Safari];

        if (this.isIOS() && !this.isDesktop()) {
            return supportedIOSBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
        }
        return supportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
    }

    isSupportedBrowserForNetworkHealth(): boolean {
        if (!this.isSupportedBrowser()) {
            return false;
        }
        const unsupportedBrowsers = ['MS-Edge'];
        const browser = this.getBrowserName();
        return unsupportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) < 0;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }

    getBrowserVersion(): string {
        return this.deviceDetectorService.browser_version;
    }

    getOSName(): string {
        return this.deviceDetectorService.os;
    }

    getOSVersion(): string {
        return this.deviceDetectorService.os_version;
    }
    getDevice(): string {
        return this.deviceDetectorService.device;
    }
}
