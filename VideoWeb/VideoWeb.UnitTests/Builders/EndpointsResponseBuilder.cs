using FizzWare.NBuilder;
using System;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class EndpointsResponseBuilder
    {
        private readonly EndpointResponse _endpoint;
        private readonly BookingsApi.Contract.V2.Responses.EndpointResponseV2 _endpointDetail;

        public EndpointsResponseBuilder()
        {
            _endpoint = Builder<EndpointResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.DisplayName = "DisplayName")
                .With(x => x.Pin = "Pin")
                .With(x => x.SipAddress = "Sip")
                .With(x => x.Status = EndpointState.Connected)
                .Build();
            
            _endpointDetail = Builder<BookingsApi.Contract.V2.Responses.EndpointResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.DisplayName = _endpoint.DisplayName)
                .With(x => x.Pin = _endpoint.Pin)
                .With(x => x.Sip = _endpoint.SipAddress)
                .Build();
        }

        public EndpointsResponseBuilder WithStatus(EndpointState state)
        {
            _endpoint.Status = state;
            return this;
        }
        
        public EndpointsResponseBuilder WithLinkedParticipant(BookingsApi.Contract.V2.Responses.EndpointParticipantResponse endpointParticipant)
        {
            _endpointDetail.EndpointParticipants.Add(endpointParticipant);
            return this;
        }

        public EndpointResponse Build()
        {
            return _endpoint;
        }
        
        public BookingsApi.Contract.V2.Responses.EndpointResponseV2 BuildEndpointDetailsResponse()
        {
            return _endpointDetail;
        }
    }
}
