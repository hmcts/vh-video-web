import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { of, throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { HearingListTableStubComponent } from 'src/app/testing/stubs/hearing-list-table-stub';
import { ProfileService } from '../../services/api/profile.service';
import { ConferenceForIndividualResponse, UserProfileResponse, Role } from '../../services/clients/api-client';
import { PluraliseTextPipe } from '../../shared/pipes/pluraliseText.pipe';
import { ParticipantHearingsComponent } from './participant-hearings.component';

const profile = new UserProfileResponse({
    role: Role.Individual,
    display_name: 'Display name',
    first_name: 'test',
    last_name: 'unit'
});

let profileServiceSpy: jasmine.SpyObj<ProfileService>;
profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

describe('ParticipantHearingsComponent with no conferences for user', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    let component: ParticipantHearingsComponent;
    let fixture: ComponentFixture<ParticipantHearingsComponent>;
    const noConferences: ConferenceForIndividualResponse[] = [];

    beforeEach(() => {
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForIndividual']);
        videoWebServiceSpy.getConferencesForIndividual.and.returnValue(of(noConferences));

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            declarations: [ParticipantHearingsComponent, HearingListTableStubComponent, PluraliseTextPipe],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show no hearings message', () => {
        expect(component.hasHearings()).toBeFalsy();
    });
});

describe('ParticipantHearingsComponent with conferences for user', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let component: ParticipantHearingsComponent;
    let fixture: ComponentFixture<ParticipantHearingsComponent>;
    const conferences = new ConferenceTestData().getTestData();

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForIndividual',
            'setActiveIndividualConference'
        ]);
        videoWebServiceSpy.getConferencesForIndividual.and.returnValue(of(conferences));

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            declarations: [ParticipantHearingsComponent, HearingListTableStubComponent, PluraliseTextPipe],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantHearingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should list hearings', () => {
        expect(component.hasHearings()).toBeTruthy();
    });

    it('should navigate to judge waiting room when conference is selected', () => {
        const router = TestBed.get(Router);
        spyOn(router, 'navigate').and.callFake(() => {});
        const conference = conferences[0];
        component.onConferenceSelected(conference);
        expect(videoWebServiceSpy.setActiveIndividualConference).toHaveBeenCalledWith(conference);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.Introduction, conference.id]);
    });

    it('should go to equipment check without conference id', () => {
        const router = TestBed.get(Router);
        spyOn(router, 'navigate').and.callFake(() => {});
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck]);
    });
});

describe('ParticipantHearingsComponent with service error', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let component: ParticipantHearingsComponent;
    let fixture: ComponentFixture<ParticipantHearingsComponent>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    const apiError = { status: 401, isApiException: true };

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForIndividual']);
        videoWebServiceSpy.getConferencesForIndividual.and.returnValue(throwError(apiError));
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));

        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
        errorServiceSpy.handleApiError.and.callFake(() => {});

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            declarations: [ParticipantHearingsComponent, HearingListTableStubComponent, PluraliseTextPipe],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useValue: profileServiceSpy },
                { provide: Logger, useClass: MockLogger },
                { provide: ErrorService, useValue: errorServiceSpy }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantHearingsComponent);
        component = fixture.componentInstance;
    });

    it('should handle api error with error service', () => {
        component.retrieveHearingsForUser();
        expect(component.loadingData).toBeFalsy();
        expect(errorServiceSpy.handleApiError).toHaveBeenCalledWith(apiError, true);
    });

    it('should not skip redirect to error page when failed more than 3 times', () => {
        component.errorCount = 3;
        component.retrieveHearingsForUser();
        expect(errorServiceSpy.handleApiError).toHaveBeenCalledWith(apiError);
    });
});
