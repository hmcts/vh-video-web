using System;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Mappings
{
    [TestFixture]
    public class JoinPrivateConsultationRequestMapperTests
    {
        [Test]
        public void Map_Success_ReturnsValidConsultationRequestResponse()
        {
            // Arrange
            Guid expectedConferenceId = Guid.NewGuid();
            Guid expectedParticipantId = Guid.NewGuid();
            string expectedRoomLabel = "expectedRoomLabel";

            JoinPrivateConsultationRequest requestToMap = new JoinPrivateConsultationRequest()
            {
                ConferenceId = expectedConferenceId,
                ParticipantId = expectedParticipantId,
                RoomLabel = expectedRoomLabel
            };
            
            // Act
            JoinPrivateConsultationRequestMapper mapper = new JoinPrivateConsultationRequestMapper();
            var mapped = mapper.Map(requestToMap);
            
            // Assert
            mapped.Answer.Should().Be(ConsultationAnswer.Accepted);
            mapped.ConferenceId.Should().Be(expectedConferenceId);
            mapped.RequestedBy.Should().Be(expectedParticipantId);
            mapped.RequestedFor.Should().Be(expectedParticipantId);
            mapped.RoomLabel.Should().Be(expectedRoomLabel);
        }
    }
}
