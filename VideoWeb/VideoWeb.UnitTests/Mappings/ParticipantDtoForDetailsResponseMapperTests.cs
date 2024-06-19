using Autofac.Extras.Moq;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;
using Moq;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantDtoForResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ParticipantDtoForResponseMapper _sut;
        private Mock<IMapTo<LinkedParticipant, LinkedParticipantResponse>> linkedParticipantMapperMock;
        private Mock<IMapTo<CivilianRoom, RoomSummaryResponse>> roomMapperMock;

        private LinkedParticipant linkedParticipant1;
        private LinkedParticipant linkedParticipant2;
        private List<LinkedParticipant> linkedParticipants;

        private LinkedParticipantResponse linkedParticipantResponse1;
        private LinkedParticipantResponse linkedParticipantResponse2;

        private CivilianRoom _civilianRoom;
        private RoomSummaryResponse roomSummaryResponse;
        private Guid participantId = Guid.NewGuid();

        [SetUp]
        public void Setup()
        {
            linkedParticipant1 = new LinkedParticipant() { LinkedId = Guid.NewGuid() };
            linkedParticipant2 = new LinkedParticipant() { LinkedId = Guid.NewGuid() };
            linkedParticipants = new List<LinkedParticipant>() { linkedParticipant1, linkedParticipant2 };
            linkedParticipantResponse1 = new LinkedParticipantResponse() { LinkedId = linkedParticipant1.LinkedId };
            linkedParticipantResponse2 = new LinkedParticipantResponse() { LinkedId = linkedParticipant2.LinkedId };
            linkedParticipantMapperMock = new Mock<IMapTo<LinkedParticipant, LinkedParticipantResponse>>();
            linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipant1)).Returns(linkedParticipantResponse1);
            linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipant2)).Returns(linkedParticipantResponse2);

            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LinkedParticipant, LinkedParticipantResponse>()).Returns(linkedParticipantMapperMock.Object);

            _civilianRoom = new CivilianRoom()
            {
                Id = 123456,
                RoomLabel = "TestCiviliantRoomLabel",
                Participants = new List<Guid>()
                {
                    participantId
                }
            };

            roomSummaryResponse = new RoomSummaryResponse()
            {
                Id = "123123",
                Label = "RoomSummaryLabel",
                Locked = false
            };

            _sut = _mocker.Create<ParticipantDtoForResponseMapper>();
        }

        [Test]
        public void Should_map_correctly()
        {
            var testParticipant = new Participant()
            {
                ContactEmail = "TestContactEmail",
                ContactTelephone = "TestContactTelephone",
                DisplayName = "TestDisplayName",
                FirstName = "TestFirstName",
                HearingRole = "TestHearingRole",
                LastName = "TestLastName",
                LinkedParticipants = linkedParticipants,
                ParticipantStatus = ParticipantStatus.Disconnected,
                RefId = Guid.NewGuid(),
                Representee = "TestRepresentee",
                Role = Role.JudicialOfficeHolder,
                Id = participantId,
                Username = "TestUsername",
                InterpreterRoom = new MeetingRoom
                {
                    Id = long.Parse(roomSummaryResponse.Id),
                    Label = roomSummaryResponse.Label,
                    Locked = roomSummaryResponse.Locked
                }
            };

            var mapped = _sut.Map(testParticipant);

            mapped.DisplayName.Should().Be(testParticipant.DisplayName);
            mapped.FirstName.Should().Be(testParticipant.FirstName);
            mapped.HearingRole.Should().Be(testParticipant.HearingRole);
            mapped.LastName.Should().Be(testParticipant.LastName);
            mapped.Status.Should().Be(testParticipant.ParticipantStatus);
            mapped.Representee.Should().Be(testParticipant.Representee);
            mapped.Role.Should().Be(testParticipant.Role);
            mapped.Id.Should().Be(testParticipant.Id);
            mapped.UserName.Should().Be(testParticipant.Username);
            mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipantResponse>() { linkedParticipantResponse1, linkedParticipantResponse2 });
            mapped.InterpreterRoom.Should().BeEquivalentTo(roomSummaryResponse);
        }
    }
}
