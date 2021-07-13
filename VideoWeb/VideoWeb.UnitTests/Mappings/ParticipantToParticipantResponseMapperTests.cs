using Autofac.Extras.Moq;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantToParticipantResponseMapperTests
    {
        protected AutoMock _mocker;
        protected ParticipantToParticipantResponseMapper _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LinkedParticipant, LinkedParticipantResponse>()).Returns(_mocker.Create<LinkedParticipantToLinkedParticipantResponseMapper>());
            _sut = _mocker.Create<ParticipantToParticipantResponseMapper>();
        }

        [Test]
        public void Should_map_correctly()
        {
            var linkedParticipant1 = new LinkedParticipant();
            var linkedParticipant2 = new LinkedParticipant();
            var linkedParticipants = new List<LinkedParticipant>()
                {
                    linkedParticipant1,
                    linkedParticipant2
                };

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
                Id = Guid.NewGuid(),
            };

            var mapped = _sut.Map(testParticipant);

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


        }
    }
}
