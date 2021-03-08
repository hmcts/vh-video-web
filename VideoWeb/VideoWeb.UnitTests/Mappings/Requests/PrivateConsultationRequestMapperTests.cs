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
        [TestCase(ConsultationAnswer.Accepted, ConsultationAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Rejected, ConsultationAnswer.Rejected)]
        [TestCase(ConsultationAnswer.None, ConsultationAnswer.None)]
        public void should_map_to_private_consultation_request(ConsultationAnswer answer, ConsultationAnswer expectedAnswer)
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
