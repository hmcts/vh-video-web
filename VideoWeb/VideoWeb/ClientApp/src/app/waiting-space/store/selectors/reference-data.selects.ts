import { createSelector } from '@ngrx/store';
import { referenceDataFeature } from '../reducers/reference-data.reducer';

export const getAvailableLanguages = createSelector(referenceDataFeature, state => state.availableLanguages);
