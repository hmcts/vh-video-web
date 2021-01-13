using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using VideoWeb.Contract.Enums;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
   public class StartPrivateConsultationRequestMappingTest : BaseMockerSutTestSetup<StartPrivateConsultationRequestMapper>
    {
        [Test]
        public void should_map_to_leave_consultation_request()
        {
            var request = Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.RequestedBy = Guid.NewGuid())
                .With(x => x.RoomType = VirtualCourtRoomType.JudgeJOH)
                .Build();

            var result = _sut.Map(request);

            result.ConferenceId.Should().Be(request.ConferenceId);
            result.RequestedBy.Should().Be(request.RequestedBy);
            result.RoomType.Should().Be(request.RoomType);
        }
    }
}

