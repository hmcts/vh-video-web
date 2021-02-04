using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class PrivateConsultationRequestMapperTests : BaseMockerSutTestSetup<PrivateConsultationRequestMapper>
    {
        [TestCase(null, null)]
        [TestCase(ConsultationAnswer.Accepted, VideoApi.Contract.Requests.ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Cancelled, VideoApi.Contract.Requests.ConsultationAnswer.Cancelled)]
        [TestCase(ConsultationAnswer.Rejected, VideoApi.Contract.Requests.ConsultationAnswer.Rejected)]
        [TestCase(ConsultationAnswer.None, VideoApi.Contract.Requests.ConsultationAnswer.None)]
        public void should_map_to_private_consultation_request(ConsultationAnswer? answer, VideoApi.Contract.Requests.ConsultationAnswer? expectedAnswer)
        {
            var request = Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.RequestedById = Guid.NewGuid())
                .With(x => x.RequestedForId = Guid.NewGuid())
                .With(x => x.Answer = answer)
                .Build();

            var result = _sut.Map(request);

            result.Answer.Should().Be(expectedAnswer);
            result.ConferenceId.Should().Be(request.ConferenceId);
            result.RequestedBy.Should().Be(request.RequestedById);
            result.RequestedFor.Should().Be(request.RequestedForId);
        }
    }
}
