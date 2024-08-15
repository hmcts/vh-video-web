import { createFeatureSelector, createReducer } from '@ngrx/store';
import { on } from '@ngrx/store';
import { ReferenceActions } from '../actions/reference-data.actions';
import { VHInterpreterLanguage } from '../models/vh-conference';

export const referenceDataFeatureKey = 'reference-data';

export interface ReferenceDataState {
    availableLanguages: VHInterpreterLanguage[];
}

export const initialState: ReferenceDataState = {
    availableLanguages: []
};

export const referenceDataReducer = createReducer(
    initialState,
    on(ReferenceActions.loadInterpreterLanguagesSuccess, (state, { languages }) => {
        return {
            ...state,
            availableLanguages: languages
        };
    })
);

export const referenceDataFeature = createFeatureSelector<ReferenceDataState>(referenceDataFeatureKey);
