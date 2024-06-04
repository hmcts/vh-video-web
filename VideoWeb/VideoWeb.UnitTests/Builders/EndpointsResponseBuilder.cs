using FizzWare.NBuilder;
using System;
using System.Collections.Generic;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class EndpointsResponseBuilder
    {
        private readonly EndpointResponse _endpoint;
        private readonly EndpointResponseV2 _endpointDetail;

        public EndpointsResponseBuilder()
        {
            _endpoint = Builder<EndpointResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.DisplayName = "DisplayName")
                .With(x => x.Pin = "Pin")
                .With(x => x.SipAddress = "Sip")
                .With(x => x.Status = EndpointState.Connected)
                .Build();
            
            _endpointDetail = Builder<EndpointResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.DisplayName = _endpoint.DisplayName)
                .With(x => x.Pin = _endpoint.Pin)
                .With(x => x.Sip = _endpoint.SipAddress)
                .With(x => x.EndpointParticipants = new List<EndpointParticipantResponse>())
                .Build();
        }

        public EndpointsResponseBuilder WithStatus(EndpointState state)
        {
            _endpoint.Status = state;
            return this;
        }
        
        public EndpointsResponseBuilder WithLinkedParticipant(EndpointParticipantResponse endpointParticipant)
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
