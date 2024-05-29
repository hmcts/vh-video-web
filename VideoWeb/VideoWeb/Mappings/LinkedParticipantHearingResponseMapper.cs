using System;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantHearingResponseMapper : IMapTo<LinkedParticipantResponseV2, LinkedParticipantResponse>
    {
        public LinkedParticipantResponse Map(LinkedParticipantResponseV2 input)
        {
            return new LinkedParticipantResponse
            {
                LinkedId = input.LinkedId,
                Type = Enum.Parse<LinkedParticipantType>(input.TypeV2.ToString())
            };
        }
    }
}
