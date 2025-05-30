import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ReferenceDataState } from '../store/reducers/reference-data.reducer';
import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { ReferenceActions } from '../store/actions/reference-data.actions';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { VHInterpreterLanguage, VHParticipant } from '../store/models/vh-conference';
import { takeUntil } from 'rxjs/operators';

import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import * as ReferenceDataSelectors from '../store/selectors/reference-data.selects';
import { ConferenceActions } from '../store/actions/conference.actions';
import { InterpreterType } from 'src/app/services/clients/api-client';
import { convertStringToTranslationId } from 'src/app/shared/translation-id-converter';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
    standalone: false,
    selector: 'app-audio-mix-selection',
    templateUrl: './audio-mix-selection.component.html',
    styleUrls: ['./audio-mix-selection.component.scss']
})
export class AudioMixSelectionComponent implements OnInit, OnDestroy {
    @Output() audioLanguageSelectionChanged = new EventEmitter();
    @Output() audioLanguageSelectionCancelled = new EventEmitter();

    bookedLanguages: VHInterpreterLanguage[];
    nonBookedLanguages: VHInterpreterLanguage[];
    languageSelectionForm: FormGroup<LanguageSelectionForm>;

    selectedAudioMixCode = 'main';

    private loggedInParticipant: VHParticipant;
    private allLanguages: VHInterpreterLanguage[] = [];
    private onDestroy$ = new Subject<void>();

    constructor(
        private formBuilder: FormBuilder,
        private conferenceStore: Store<ConferenceState>,
        private refDataStore: Store<ReferenceDataState>
    ) {
        this.createForm();
    }

    createForm() {
        this.languageSelectionForm = this.formBuilder.group({
            languageCode: new FormControl<string | null>(this.selectedAudioMixCode)
        });
    }

    ngOnInit(): void {
        this.refDataStore.dispatch(ReferenceActions.loadInterpreterLanguages());

        const availableLanguages$ = this.refDataStore.select(ReferenceDataSelectors.getAvailableLanguages);
        const participants$ = this.conferenceStore.select(ConferenceSelectors.getParticipants);
        const endpoints$ = this.conferenceStore.select(ConferenceSelectors.getEndpoints);
        const loggedInParticipant$ = this.conferenceStore.select(ConferenceSelectors.getLoggedInParticipant);

        combineLatest([availableLanguages$, participants$, endpoints$, loggedInParticipant$])
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(([languages, participants, endpoints, loggedInParticipant]) => {
                this.loggedInParticipant = loggedInParticipant;
                this.selectedAudioMixCode = this.loggedInParticipant.currentAudioMix || 'main';
                this.languageSelectionForm.setValue({ languageCode: this.selectedAudioMixCode });
                this.allLanguages = languages.filter(lang => lang.type === InterpreterType.Verbal);
                const allBookedLanguages = participants
                    .filter(p => p.interpreterLanguage && p.interpreterLanguage.type === InterpreterType.Verbal)
                    .map(p => p.interpreterLanguage)
                    .concat(
                        endpoints
                            .filter(e => e.interpreterLanguage && e.interpreterLanguage.type === InterpreterType.Verbal)
                            .map(e => e.interpreterLanguage)
                    );
                // Remove duplicates based on the 'code' property
                const uniqueBookedLanguages = Array.from(new Map(allBookedLanguages.map(lang => [lang.code, lang])).values());
                uniqueBookedLanguages.sort((a, b) => a.description.localeCompare(b.description));
                this.bookedLanguages = uniqueBookedLanguages;

                this.nonBookedLanguages = this.allLanguages.filter(lang => !this.bookedLanguages.some(b => b.code === lang.code));
            });
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onAudioLanguageSelectionChanged(audioMixCode: string) {
        this.selectedAudioMixCode = audioMixCode;
    }

    updateLanguageAudioMix() {
        if (this.selectedAudioMixCode === 'main') {
            this.conferenceStore.dispatch(
                ConferenceActions.updateAudioMix({
                    participant: this.loggedInParticipant,
                    interpreterLanguage: undefined,
                    mainCourt: true
                })
            );
            this.audioLanguageSelectionChanged.emit();
            return;
        }
        const language = this.allLanguages.find(l => l.code === this.selectedAudioMixCode);
        this.conferenceStore.dispatch(
            ConferenceActions.updateAudioMix({
                participant: this.loggedInParticipant,
                interpreterLanguage: language,
                mainCourt: false
            })
        );
        this.audioLanguageSelectionChanged.emit();
    }

    onCancel() {
        this.audioLanguageSelectionCancelled.emit();
    }

    stringToTranslateId(str: string) {
        return convertStringToTranslationId(str);
    }
}

interface LanguageSelectionForm {
    languageCode: FormControl<string | null>;
}
