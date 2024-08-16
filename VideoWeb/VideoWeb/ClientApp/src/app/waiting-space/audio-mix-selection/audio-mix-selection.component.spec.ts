import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioMixSelectionComponent } from './audio-mix-selection.component';
import { ReferenceDataState } from '../store/reducers/reference-data.reducer';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../store/reducers/conference.reducer';
import {
    mapConferenceToVHConference,
    mapEndpointToVHEndpoint,
    mapInterpeterLanguageToVHInterpreterLanguage,
    mapParticipantToVHParticipant
} from '../store/models/api-contract-to-state-model-mappers';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import * as ReferenceDataSelectors from '../store/selectors/reference-data.selects';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import { InterpreterType } from 'src/app/services/clients/api-client';

describe('AudioMixSelectionComponent', () => {
    const testData = new ConferenceTestData();
    const participants = testData.getListOfParticipants();
    const endpoints = testData.getListOfEndpoints();
    const languages = testData.getInterpreterLanguageResponse();

    let translateSpy: jasmine.Spy;

    let component: AudioMixSelectionComponent;
    let fixture: ComponentFixture<AudioMixSelectionComponent>;

    let mockConferenceStore: MockStore<ConferenceState>;
    let mockReferenceDataStore: MockStore<ReferenceDataState>;

    beforeEach(async () => {
        mockConferenceStore = createMockStore({
            initialState: { currentConference: mapConferenceToVHConference(testData.getConferenceDetailNow()), availableRooms: [] }
        });

        await TestBed.configureTestingModule({
            declarations: [AudioMixSelectionComponent, MockPipe(TranslatePipe, translateSpy)],
            providers: [provideMockStore()]
        }).compileComponents();

        fixture = TestBed.createComponent(AudioMixSelectionComponent);
        component = fixture.componentInstance;

        mockConferenceStore = TestBed.inject(MockStore);
        mockReferenceDataStore = TestBed.inject(MockStore);

        mockConferenceStore.overrideSelector(
            ConferenceSelectors.getEndpoints,
            endpoints.map(x => mapEndpointToVHEndpoint(x))
        );

        participants[0].interpreter_language = languages.filter(x => x.type === InterpreterType.Verbal)[0];
        participants[1].interpreter_language = languages.filter(x => x.type === InterpreterType.Verbal)[1];
        mockConferenceStore.overrideSelector(
            ConferenceSelectors.getParticipants,
            participants.map(x => mapParticipantToVHParticipant(x))
        );

        mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, mapParticipantToVHParticipant(participants[0]));

        mockReferenceDataStore.overrideSelector(
            ReferenceDataSelectors.getAvailableLanguages,
            languages.map(mapInterpeterLanguageToVHInterpreterLanguage)
        );

        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
        mockConferenceStore.resetSelectors();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        const verbalLanguages = languages.filter(x => x.type === InterpreterType.Verbal);
        expect(component.bookedLanguages.length).toBe(2);
        expect(component.nonBookedLanguages.length).toBe(verbalLanguages.length - 2);
    });

    it('should dispatch updateAudioMix action when main is selected', () => {
        const dispatchSpy = spyOn(mockConferenceStore, 'dispatch');
        const emitSpy = spyOn(component.audioLanguageSelectionChanged, 'emit');
        component.onAudioLanguageSelectionChanged('main');

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch updateAudioMix action when a language is selected', () => {
        const dispatchSpy = spyOn(mockConferenceStore, 'dispatch');
        const emitSpy = spyOn(component.audioLanguageSelectionChanged, 'emit');
        component.onAudioLanguageSelectionChanged('en');

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit event when cancel is clicked', () => {
        const emitSpy = spyOn(component.audioLanguageSelectionCancelled, 'emit');
        component.onCancel();

        expect(emitSpy).toHaveBeenCalledTimes(1);
    });
});
