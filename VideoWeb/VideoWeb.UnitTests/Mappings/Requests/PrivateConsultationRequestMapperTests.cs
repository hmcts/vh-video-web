using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings.Requests;

namespace VideoWeb.UnitTests.Mappings.Requests
{
    public class PrivateConsultationRequestMapperTests
    {
        [TestCase(null, null)]
        [TestCase(ConsultationAnswer.Accepted, Services.Video.ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Cancelled, Services.Video.ConsultationAnswer.Cancelled)]
        [TestCase(ConsultationAnswer.Rejected, Services.Video.ConsultationAnswer.Rejected)]
        [TestCase(ConsultationAnswer.None, Services.Video.ConsultationAnswer.None)]
        public void should_map_to_private_consultation_request(ConsultationAnswer? answer, Services.Video.ConsultationAnswer? expectedAnswer)
        {
            var request = Builder<PrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.RequestedById = Guid.NewGuid())
                .With(x => x.RequestedForId = Guid.NewGuid())
                .With(x => x.Answer = answer)
                .Build();

            var result = PrivateConsultationRequestMapper.MapToApiConsultationRequest(request);

            result.Answer.Should().Be(expectedAnswer);
            result.Conference_id.Should().Be(request.ConferenceId);
            result.Requested_by.Should().Be(request.RequestedById);
            result.Requested_for.Should().Be(request.RequestedForId);
        }
    }
}