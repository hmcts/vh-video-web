using System;
using System.Collections.Generic;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class EndpointCacheMapper
    {
        public static Endpoint MapEndpointToCacheModel(EndpointResponse endpointResponse)
        {
            return new Endpoint
            {
                Id = endpointResponse.Id,
                DisplayName = endpointResponse.DisplayName,
                EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString()),
            };
        }
    }
    
    public static class EndpointParticipantCacheMapper
    {
        public static EndpointParticipant MapEndpointParticipantToCacheModel(EndpointParticipantResponse endpointParticipantResponse, IList<Participant> participants)
        {
            return new EndpointParticipant
            {
                ParticipantId = participants.Single(x => x.RefId == endpointParticipantResponse.ParticipantId).Id,
                ParticipantRefId = endpointParticipantResponse.ParticipantId,
                ParticipantUsername = participants.Single(x => x.RefId == endpointParticipantResponse.ParticipantId).Username,
                LinkedParticipantType =  Enum.Parse<LinkType>(endpointParticipantResponse.LinkedParticipantType.ToString())
            };
        }
    }
}
