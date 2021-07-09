import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ParticipantStatus } from '../../services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { JudgeContextMenuComponent } from './judge-context-menu.component';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallWitnessIntoHearingEvent,
    DismissWitnessFromHearingEvent
} from 'src/app/shared/models/participant-event';
import { ElementRef } from '@angular/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';

describe('JudgeContextMenuComponent', () => {
    const participants = new ConferenceTestData().getListOfParticipants();
    const logger = new MockLogger();
    let elementRef: ElementRef<HTMLDivElement>;
    let nativeElement: HTMLDivElement;

    let component: JudgeContextMenuComponent;
    const translateService = translateServiceSpy;

    const mapper = new ParticipantPanelModelMapper();

    beforeEach(() => {
        nativeElement = document.createElement('div');
        elementRef = new ElementRef<HTMLDivElement>(nativeElement);
        component = new JudgeContextMenuComponent(logger, elementRef, translateService);
        component.participant = mapper.mapFromParticipantUserResponse(participants[0]);
    });

    it('should getAdditionalText return displayname as default', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(participants[0]);
        component.participant = model;
        expect(component.getAdditionalText()).toContain(``);
    });

    it('should getAdditionalText return hearing role and case role for an individual', () => {
        const p = participants[1];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}<br/>${p.case_type_group}`);
    });

    it('should getAdditionalText return hearing role and case role for a representative', () => {
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role} for ${p.representee}<br/>${p.case_type_group}`);
    });

    it('should getAdditionalText return hearing role and case role for an observer', () => {
        const p = participants[5];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}`);
    });

    it('should getAdditionalText return hearing role and case role for a panel member', () => {
        const p = participants[6];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(`<br/>${p.hearing_role}`);
    });

    it('should getAdditionalText return display name for judge', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        expect(component.getAdditionalText()).toEqual(``);
    });

    it('should emit event when lowering participant hand', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        spyOn(component.lowerParticipantHandEvent, 'emit');

        // Act
        component.lowerParticipantHand();

        // Assert
        expect(component.lowerParticipantHandEvent.emit).toHaveBeenCalled();
        expect(component.lowerParticipantHandEvent.emit).toHaveBeenCalledWith(new LowerParticipantHandEvent(model));
    });

    it('should emit event when toggling spotlight', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        spyOn(component.toggleSpotlightParticipantEvent, 'emit');

        // Act
        component.toggleSpotlightParticipant();

        // Assert
        expect(component.toggleSpotlightParticipantEvent.emit).toHaveBeenCalled();
        expect(component.toggleSpotlightParticipantEvent.emit).toHaveBeenCalledWith(new ToggleSpotlightParticipantEvent(model));
    });

    it('should emit event when toggling mute', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        spyOn(component.toggleMuteParticipantEvent, 'emit');

        // Act
        component.toggleMuteParticipant();

        // Assert
        expect(component.toggleMuteParticipantEvent.emit).toHaveBeenCalled();
        expect(component.toggleMuteParticipantEvent.emit).toHaveBeenCalledWith(new ToggleMuteParticipantEvent(model));
    });

    it('should emit event when calling witness', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        spyOn(component.callWitnessIntoHearingEvent, 'emit');

        // Act
        component.callWitnessIntoHearing();

        // Assert
        expect(component.callWitnessIntoHearingEvent.emit).toHaveBeenCalled();
        expect(component.callWitnessIntoHearingEvent.emit).toHaveBeenCalledWith(new CallWitnessIntoHearingEvent(model));
    });

    it('should emit event when dismissing witness', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = new ParticipantPanelModel(p);
        component.participant = model;
        spyOn(component.dismissWitnessFromHearingEvent, 'emit');

        // Act
        component.dismissWitnessFromHearing();

        // Assert
        expect(component.dismissWitnessFromHearingEvent.emit).toHaveBeenCalled();
        expect(component.dismissWitnessFromHearingEvent.emit).toHaveBeenCalledWith(new DismissWitnessFromHearingEvent(model));
    });

    it('should close context menu if click is outside of the menu', () => {
        // Arrange
        spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(true);
        component.isDroppedDown = true;
        const event = new MouseEvent('click', {
            clientX: 15,
            clientY: 15
        });

        // Act
        component.clickout(event);

        // Assert
        expect(component.isDroppedDown).toBeFalsy();
    });

    it('should not close context menu if click is inside of the menu', () => {
        // Arrange
        spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(false);
        component.isDroppedDown = true;
        const event = new MouseEvent('click', {
            clientX: 15,
            clientY: 15
        });

        // Act
        component.clickout(event);

        // Assert
        expect(component.isDroppedDown).toBeTruthy();
    });

    it('should return isClickedOutsideOfOpenMenu true when click event is outside element and menu is open', () => {
        // Arrange
        component.isDroppedDown = true;
        spyOn(elementRef.nativeElement, 'contains').and.returnValue(false);
        const event = new MouseEvent('click');
        spyOnProperty(event, 'target').and.returnValue(new EventTarget());

        // Act
        const result = component.isClickedOutsideOfOpenMenu(event);

        // Assert
        expect(result).toBeTruthy();
    });

    it('should return isClickedOutsideOfOpenMenu false when click event is outside element and menu is closed', () => {
        // Arrange
        component.isDroppedDown = false;
        spyOn(elementRef.nativeElement, 'contains').and.returnValue(false);
        const event = new MouseEvent('click');
        spyOnProperty(event, 'target').and.returnValue(new EventTarget());

        // Act
        const result = component.isClickedOutsideOfOpenMenu(event);

        // Assert
        expect(result).toBeFalsy();
    });

    it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is open', () => {
        // Arrange
        component.isDroppedDown = true;
        spyOn(elementRef.nativeElement, 'contains').and.returnValue(true);
        const event = new MouseEvent('click');
        spyOnProperty(event, 'target').and.returnValue(new EventTarget());

        // Act
        const result = component.isClickedOutsideOfOpenMenu(event);

        // Assert
        expect(result).toBeFalsy();
    });

    it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is closed', () => {
        // Arrange
        component.isDroppedDown = false;
        spyOn(elementRef.nativeElement, 'contains').and.returnValue(false);
        const event = new MouseEvent('click');
        spyOnProperty(event, 'target').and.returnValue(new EventTarget());

        // Act
        const result = component.isClickedOutsideOfOpenMenu(event);

        // Assert
        expect(result).toBeFalsy();
    });
});
