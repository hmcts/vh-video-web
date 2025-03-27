using System;
using System.Linq;
using BookingsApi.Contract.V2.Responses;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public static class EndpointCacheMapper
    {
        public static Endpoint MapEndpointToCacheModel(EndpointResponse endpointResponse, EndpointResponseV2 endpointForHearingResponse)
        {
            return new Endpoint
            {
                Id = endpointResponse.Id,
                DisplayName = endpointResponse.DisplayName,
                EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString()),
                ParticipantsLinked = endpointResponse.ParticipantsLinked.ToList(),
                CurrentRoom = MapRoom(endpointResponse.CurrentRoom),
                InterpreterLanguage = endpointForHearingResponse.InterpreterLanguage?.Map(),
                ExternalReferenceId = endpointForHearingResponse.ExternalReferenceId,
                ProtectFrom = endpointForHearingResponse.Screening?.ProtectedFrom ?? []
            };
        }
        private static ConsultationRoom MapRoom(RoomResponse room)
        {
            if (room == null) return null;
            
            return new ConsultationRoom
            {
                Id = room.Id,
                Label = room.Label,
                Locked = room.Locked
            };
        }
    }
}
