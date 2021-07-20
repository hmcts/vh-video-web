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
    public class ParticipantToParticipantResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ParticipantToParticipantResponseMapper _sut;
        private Mock<IMapTo<LinkedParticipant, LinkedParticipantResponse>> linkedParticipantMapperMock;
        private Mock<IMapTo<CivilianRoom, RoomSummaryResponse>> roomMapperMock;

        private LinkedParticipant linkedParticipant1;
        private LinkedParticipant linkedParticipant2;
        private List<LinkedParticipant> linkedParticipants;

        private LinkedParticipantResponse linkedParticipantResponse1;
        private LinkedParticipantResponse linkedParticipantResponse2;

        private CivilianRoom civilianRoom;
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

            civilianRoom = new CivilianRoom()
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
                Id = "RoomSummaryResponseId",
                Label = "RoomSummaryLabel",
                Locked = false
            };

            roomMapperMock = new Mock<IMapTo<CivilianRoom, RoomSummaryResponse>>();
            roomMapperMock.Setup(mapper => mapper.Map(civilianRoom)).Returns(roomSummaryResponse);
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<CivilianRoom, RoomSummaryResponse>()).Returns(roomMapperMock.Object);

            _sut = _mocker.Create<ParticipantToParticipantResponseMapper>();
        }

        [Test]
        public void Should_map_correctly()
        {
            var testParticipant = new Participant()
            {
                CaseTypeGroup = "TestCaseTypeGroup",
                ContactEmail = "TestContactEmail",
                ContactTelephone = "TestContactTelephone",
                DisplayName = "TestDisplayName",
                FirstName = "TestFirstName",
                HearingRole = "TestHearingRole",
                LastName = "TestLastName",
                LinkedParticipants = linkedParticipants,
                Name = "TestName",
                ParticipantStatus = ParticipantStatus.Disconnected,
                RefId = Guid.NewGuid(),
                Representee = "TestRepresentee",
                Role = Role.JudicialOfficeHolder,
                Id = participantId,
                Username = "TestUsername",
            };

            var testConference = new Conference()
            {
                CivilianRooms = new List<CivilianRoom> {
                    civilianRoom
                }
            };

            var mapped = _sut.Map(testParticipant, testConference);

            mapped.CaseTypeGroup.Should().Be(testParticipant.CaseTypeGroup);
            mapped.DisplayName.Should().Be(testParticipant.DisplayName);
            mapped.FirstName.Should().Be(testParticipant.FirstName);
            mapped.HearingRole.Should().Be(testParticipant.HearingRole);
            mapped.LastName.Should().Be(testParticipant.LastName);
            mapped.Name.Should().Be(testParticipant.Name);
            mapped.Status.Should().Be(testParticipant.ParticipantStatus);
            mapped.Representee.Should().Be(testParticipant.Representee);
            mapped.Role.Should().Be(testParticipant.Role);
            mapped.Id.Should().Be(testParticipant.Id);
            mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipantResponse>() { linkedParticipantResponse1, linkedParticipantResponse2 });

            mapped.InterpreterRoom.Should().Be(roomSummaryResponse);

            linkedParticipants.ForEach(linkedParticipant => linkedParticipantMapperMock.Verify(mapper => mapper.Map(linkedParticipant), Times.Once));
            linkedParticipantMapperMock.Verify(mapper => mapper.Map(It.IsAny<LinkedParticipant>()), Times.Exactly(linkedParticipants.Count));
        }
    }
}
