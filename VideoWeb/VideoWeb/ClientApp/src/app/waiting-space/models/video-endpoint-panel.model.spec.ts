import { EndpointStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoEndpointPanelModel } from './video-endpoint-panel-model';

describe('VideoEndpointPanelModel', () => {
    let model: VideoEndpointPanelModel;
    let endpoint: VideoEndpointResponse;

    beforeEach(() => {
        endpoint = new ConferenceTestData().getListOfEndpoints()[0];
    });

    it('should return isDisconnected: true when endpoint is disconnected', () => {
        endpoint.status = EndpointStatus.Disconnected;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isDisconnected()).toBeTruthy();
    });

    it('should return isDisconnected: false when endpoint is connected', () => {
        endpoint.status = EndpointStatus.Connected;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isDisconnected()).toBeFalsy();
    });

    it('should return isAvailable: false when endpoint is disconnected', () => {
        endpoint.status = EndpointStatus.Disconnected;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isAvailable()).toBeFalsy();
    });

    it('should return isAvailable: true when endpoint is connected', () => {
        endpoint.status = EndpointStatus.Connected;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isAvailable()).toBeTruthy();
    });

    it('should return isInConsultation: false when endpoint is in available', () => {
        endpoint.status = EndpointStatus.Disconnected;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isInConsultation()).toBeFalsy();
    });

    it('should return isInConsultation: true when endpoint is in consultation', () => {
        endpoint.status = EndpointStatus.InConsultation;
        model = new VideoEndpointPanelModel(endpoint);
        expect(model.isInConsultation()).toBeTruthy();
    });
});
