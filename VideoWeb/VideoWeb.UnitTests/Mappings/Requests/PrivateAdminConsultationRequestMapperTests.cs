
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
    public class PrivateAdminConsultationRequestMapperTests
    {
        [TestCase(ConsultationAnswer.Accepted, ApiConsultationRequestAnswer.Accepted)]
        [TestCase(ConsultationAnswer.Cancelled, ApiConsultationRequestAnswer.Cancelled)]
        [TestCase(ConsultationAnswer.Rejected, ApiConsultationRequestAnswer.Rejected)]
        [TestCase(ConsultationAnswer.None, ApiConsultationRequestAnswer.None)]
        public void should_map_to_admin_consultation_request(ConsultationAnswer answer, ApiConsultationRequestAnswer? expectedAnswer)
        {
            var request = Builder<PrivateAdminConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = Guid.NewGuid())
                .With(x => x.ParticipantId = Guid.NewGuid())
                .With(x => x.ConsultationRoom = RoomType.ConsultationRoom1)
                .With(x => x.Answer = answer)
                .Build();
            
            var result = PrivateAdminConsultationRequestMapper.MapToAdminConsultationRequest(request);

            result.Conference_id.Should().Be(request.ConferenceId);
            result.Participant_id.Should().Be(request.ParticipantId);
            result.Consultation_room.Should().Be(request.ConsultationRoom);
            result.Answer.Should().Be(answer);
        }
    }
}
