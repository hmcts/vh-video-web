using System;
using BookingsApi.Contract.V2.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class LinkedParticipantHearingResponseMapper : IMapTo<LinkedParticipantResponseV2, LinkedParticipant>
    {
        public LinkedParticipant Map(LinkedParticipantResponseV2 input)
        {
            return new LinkedParticipant
            {
                LinkedId = input.LinkedId,
                LinkType = Enum.Parse<LinkType>(input.TypeV2.ToString())
            };
        }
    }
}
