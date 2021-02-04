using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class LeavePrivateConsultationRequestMapperTests : BaseMockerSutTestSetup<LeavePrivateConsultationRequestMapper>
    {
        [Test]
        public void should_map_to_leave_consultation_request()
        {
            var request = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.ParticipantId = Guid.NewGuid())
                .Build();
            
            var result = _sut.Map(request);

            result.ConferenceId.Should().Be(request.ConferenceId);
            result.ParticipantId.Should().Be(request.ParticipantId);
        }
    }
}
