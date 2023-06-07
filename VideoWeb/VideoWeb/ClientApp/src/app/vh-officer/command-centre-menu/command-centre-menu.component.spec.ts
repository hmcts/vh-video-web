import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { MenuOption } from '../models/menus-options';
import { CommandCentreMenuComponent } from './command-centre-menu.component';
import { EventBusService, EmitEvent, VHEventType } from 'src/app/services/event-bus.service';
import { ProfileService } from '../../services/api/profile.service';
import { VideoWebService } from '../../services/api/video-web.service';
import { Router } from '@angular/router';
import { Role, UserProfileResponse } from '../../services/clients/api-client';
import { fakeAsync, tick } from '@angular/core/testing';
import { ConferenceTestData } from '../../testing/mocks/data/conference-test-data';
import { pageUrls } from '../../shared/page-url.constants';

describe('CommandCentreMenuComponent', () => {
    let component: CommandCentreMenuComponent;
    let profileService: jasmine.SpyObj<ProfileService>;
    let router: jasmine.SpyObj<Router>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const eventbus = new EventBusService();
    const logger: Logger = new MockLogger();

    const mockProfile: UserProfileResponse = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        roles: [Role.StaffMember, Role.VideoHearingsOfficer]
    });
    beforeAll(() => {
        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profileService.getUserProfile.and.returnValue(Promise.resolve(mockProfile));
        router = jasmine.createSpyObj<Router>('Router', ['serializeUrl', 'createUrlTree', 'navigate']);
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['staffMemberJoinConference', 'getConferenceById']);
    });

    beforeEach(() => {
        component = new CommandCentreMenuComponent(logger, eventbus, router, videoWebService, profileService);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should default to hearings menu option on init', () => {
        component.currentMenu = null;

        component.ngOnInit();

        expect(component.currentMenu).toBe(MenuOption.Hearing);
    });

    it('should emit hearing menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Hearing;

        component.displayHearing();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should emit message menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Message;

        component.displayMessages();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should emit announcement menu selected', () => {
        component.currentMenu = null;
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Announcement;

        component.displayAnnouncements();

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should display im when im clicked event is received', () => {
        component.setupSubscribers();
        spyOn(component.selectedMenu, 'emit');
        const menu = MenuOption.Message;

        eventbus.emit(new EmitEvent(VHEventType.ConferenceImClicked, null));

        expect(component.selectedMenu.emit).toHaveBeenCalledWith(menu);
        expect(component.currentMenu).toBe(menu);
    });

    it('should navigate to staff waiting room when conference is selected for user as a staff-member who already exists in conference', fakeAsync(() => {
        // ARRANGE
        const conference = new ConferenceTestData().getConferenceForHostResponse();
        const staffMember = conference.participants.find(x => x.role === Role.StaffMember);
        router.navigate.calls.reset();
        profileService.getUserProfile.and.returnValue(Promise.resolve(staffMember));
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        component.conferenceId = conference.id;
        // ACT
        component.ngOnInit();
        component.signIntoConference();
        tick();
        // ASSERT
        expect(router.createUrlTree).toHaveBeenCalledWith([pageUrls.StaffMemberWaitingRoom, conference.id]);
    }));

    it('should navigate to staff waiting room when conference is selected for user as a new staff-member', fakeAsync(() => {
        // ARRANGE
        const conference = new ConferenceTestData().getConferenceForHostResponse();
        router.navigate.calls.reset();
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.staffMemberJoinConference.and.returnValue(Promise.resolve(conference));
        component.conferenceId = conference.id;
        // ACT
        component.ngOnInit();
        component.signIntoConference();
        tick();
        // ASSERT
        expect(router.createUrlTree).toHaveBeenCalledWith([pageUrls.StaffMemberWaitingRoom, conference.id]);
    }));

    it('isStaffMember should return true when user is a staff member', fakeAsync(() => {
        profileService.getUserProfile.and.returnValue(
            Promise.resolve(new UserProfileResponse({ roles: [Role.StaffMember, Role.VideoHearingsOfficer] }))
        );
        component.ngOnInit();
        tick();
        expect(component.isStaffMember).toBeTrue();
    }));

    it('isStaffMember should return false when user not a staff member', fakeAsync(() => {
        profileService.getUserProfile.and.returnValue(Promise.resolve(new UserProfileResponse({ roles: [Role.VideoHearingsOfficer] })));
        component.ngOnInit();
        tick();
        expect(component.isStaffMember).toBeFalsy();
    }));

    it('isStaffMember should return false when user not set', fakeAsync(() => {
        profileService.getUserProfile.and.returnValue(Promise.resolve(null));
        component.ngOnInit();
        tick();
        expect(component.isStaffMember).toBeFalsy();
    }));
});
