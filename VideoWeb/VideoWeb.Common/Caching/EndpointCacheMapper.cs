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
            var model = new Endpoint();
            model.Id = endpointResponse.Id;
            model.DisplayName = endpointResponse.DisplayName;
            model.EndpointStatus = (EndpointStatus) Enum.Parse(typeof(EndpointStatus), endpointResponse.Status.ToString());
            model.ParticipantsLinked = endpointResponse.ParticipantsLinked?.ToList() ?? [];
            model.CurrentRoom = MapRoom(endpointResponse.CurrentRoom);
            model.InterpreterLanguage = endpointForHearingResponse.InterpreterLanguage?.Map();
            model.ExternalReferenceId = endpointForHearingResponse.ExternalReferenceId;
            model.ProtectFrom = endpointForHearingResponse.Screening?.ProtectedFrom ?? [];
            return model;
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
