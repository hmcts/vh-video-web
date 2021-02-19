
using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;
using ApiConsultationRequestAnswer =  VideoWeb.Services.Video.ConsultationAnswer;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class PrivateAdminConsultationRequestMapperTests : BaseMockerSutTestSetup<PrivateConsultationRequestMapper>
    {
        [TestCase(ConsultationAnswer.Accepted, ApiConsultationRequestAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected, ApiConsultationRequestAnswer.Rejected)]
        [TestCase(ConsultationAnswer.None, ApiConsultationRequestAnswer.None)]
        public void should_map_to_admin_consultation_request(ConsultationAnswer answer, ApiConsultationRequestAnswer? expectedAnswer)
        {
            var request = Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.RequestedById = Guid.NewGuid())
                .With(x => x.RequestedForId = Guid.NewGuid())
                .With(x => x.RoomLabel = "ConsultationRoom")
                .With(x => x.Answer = answer)
                .Build();
            
            var result = _sut.Map(request);

            result.Conference_id.Should().Be(request.ConferenceId);
            result.Requested_by.Should().Be(request.RequestedById);
            result.Requested_for.Should().Be(request.RequestedForId);
            result.Room_label.Should().Be(request.RoomLabel);
            result.Answer.Should().Be(answer);
        }
    }
}
