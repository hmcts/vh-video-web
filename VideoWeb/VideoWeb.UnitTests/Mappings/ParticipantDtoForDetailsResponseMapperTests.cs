using Autofac.Extras.Moq;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using InterpreterType = VideoWeb.Common.Models.InterpreterType;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantDtoForResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ParticipantDtoForResponseMapper _sut;

        private LinkedParticipant linkedParticipant1;
        private LinkedParticipant linkedParticipant2;
        private List<LinkedParticipant> linkedParticipants;

        private LinkedParticipantResponse linkedParticipantResponse1;
        private LinkedParticipantResponse linkedParticipantResponse2;

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

            _mocker = AutoMock.GetLoose();

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
            var testParticipant = CreateParticipant();

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
            mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipantResponse> { linkedParticipantResponse1, linkedParticipantResponse2 });
            mapped.InterpreterRoom.Should().BeEquivalentTo(roomSummaryResponse);
            mapped.CurrentRoom.Should().NotBeNull();
            mapped.CurrentRoom.Label.Should().Be(testParticipant.CurrentRoom.Label);
            mapped.CurrentRoom.Locked.Should().Be(testParticipant.CurrentRoom.Locked);
            mapped.InterpreterLanguage.Should().BeEquivalentTo(testParticipant.InterpreterLanguage.Map());
        }

        [Test]
        public void should_map_correctly_without_interpreter_language()
        {
            var participant = CreateParticipant();
            participant.InterpreterLanguage = null;
            
            var mapped = _sut.Map(participant);

            mapped.InterpreterLanguage.Should().BeNull();
        }

        private Participant CreateParticipant()
        {
            return new Participant
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
                CurrentRoom = new ConsultationRoom
                {
                    Label = "Room1",
                    Locked = true
                },
                InterpreterRoom = new ConsultationRoom
                {
                    Id = long.Parse(roomSummaryResponse.Id),
                    Label = roomSummaryResponse.Label,
                    Locked = roomSummaryResponse.Locked
                },
                InterpreterLanguage = new InterpreterLanguage
                {
                    Code = "spa",
                    Description = "Spanish",
                    Type = InterpreterType.Verbal
                }
            };
        }
    }
}
