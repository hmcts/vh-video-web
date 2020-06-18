using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class LeavePrivateConsultationRequestMapperTests
    {
        [Test]
        public void should_map_to_leave_consultation_request()
        {
            var request = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.ParticipantId = Guid.NewGuid())
                .Build();
            
            var result = LeavePrivateConsultationRequestMapper.MapToLeaveConsultationRequest(request);

            result.Conference_id.Should().Be(request.ConferenceId);
            result.Participant_id.Should().Be(request.ParticipantId);
        }
    }
}