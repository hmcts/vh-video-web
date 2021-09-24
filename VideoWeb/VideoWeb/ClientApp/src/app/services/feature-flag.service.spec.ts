import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { ApiClient } from './clients/api-client';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

let service: FeatureFlagService;
let clientApiSpy: jasmine.SpyObj<ApiClient>;
describe('FeatureFlagService', () => {
    beforeEach(() => {
        clientApiSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getFeatureFlag']);
        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            providers: [{ provide: ApiClient, useValue: clientApiSpy }]
        });

        service = TestBed.inject(FeatureFlagService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should return the feature config for staff member feature turned on', () => {
        clientApiSpy.getFeatureFlag.and.returnValue(of(true));

        service.getFeatureFlagByName('StaffMemberFeature').subscribe(result => {
            expect(result).toBeTruthy();
        });
    });
    it('should return the feature config for staff member feature turned off', () => {
        clientApiSpy.getFeatureFlag.and.returnValue(of(false));

        service.getFeatureFlagByName('StaffMemberFeature').subscribe(result => {
            expect(result).toBeFalsy();
        });
    });
});
