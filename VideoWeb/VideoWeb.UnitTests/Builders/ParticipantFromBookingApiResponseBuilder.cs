using System;
using System.Collections.Generic;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class ParticipantFromBookingApiResponseBuilder
    {
        private readonly ISingleObjectBuilder<ParticipantResponseV2> _participant;

        public ParticipantFromBookingApiResponseBuilder(UserRole role, string hearingRole)
        {
            _participant = Builder<ParticipantResponseV2>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.UserRoleName = role.ToString())
                .With(x => x.HearingRoleName = hearingRole);
        }
        
        public ParticipantResponseV2 Build()
        {
            return _participant.Build();
        }
    }
}
