using Autofac.Extras.Moq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Mappings
{
    class ParticipantRequestMapperTests
    {
        protected AutoMock _mocker;
        protected ParticipantRequestMapper _sut;

        private Mock<IMapTo<LinkedParticipantRequest, LinkedParticipant>> linkedParticipantMapperMock;

        private LinkedParticipantRequest linkedParticipantRequest1;
        private LinkedParticipantRequest linkedParticipantRequest2;
        private List<LinkedParticipantRequest> linkedParticipantRequests;

        private LinkedParticipant linkedParticipant1;
        private LinkedParticipant linkedParticipant2;

        [SetUp]
        public void Setup()
        {
            linkedParticipantRequest1 = new LinkedParticipantRequest() { LinkedRefId = Guid.NewGuid() };
            linkedParticipantRequest2 = new LinkedParticipantRequest() { LinkedRefId = Guid.NewGuid() };
            linkedParticipantRequests = new List<LinkedParticipantRequest>() { linkedParticipantRequest1, linkedParticipantRequest2 };
            linkedParticipant1 = new LinkedParticipant() { LinkedId = linkedParticipantRequest1.LinkedRefId };
            linkedParticipant2 = new LinkedParticipant() { LinkedId = linkedParticipantRequest2.LinkedRefId };
            linkedParticipantMapperMock = new Mock<IMapTo<LinkedParticipantRequest, LinkedParticipant>>();
            linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipantRequest1)).Returns(linkedParticipant1);
            linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipantRequest2)).Returns(linkedParticipant2);

            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LinkedParticipantRequest, LinkedParticipant>()).Returns(linkedParticipantMapperMock.Object);
            _sut = _mocker.Create<ParticipantRequestMapper>();
        }

        [Test]
        public void Should_map_correctly()
        {
            var testParticipant = new ParticipantRequest()
            {
                CaseTypeGroup = "TestCaseTypeGroup",
                ContactEmail = "TestContactEmail",
                ContactTelephone = "TestContactTelephone",
                DisplayName = "TestDisplayName",
                FirstName = "TestFirstName",
                HearingRole = "TestHearingRole",
                LastName = "TestLastName",
                LinkedParticipants = linkedParticipantRequests,
                Name = "TestName",
                Representee = "TestRepresentee",
                Username = "TestUsername",
                UserRole = UserRole.JudicialOfficeHolder,
                ParticipantRefId = Guid.NewGuid(),
                Id = Guid.NewGuid(),
            };

            var mapped = _sut.Map(testParticipant);

            mapped.CaseTypeGroup.Should().Be(testParticipant.CaseTypeGroup);
            mapped.ContactEmail.Should().Be(testParticipant.ContactEmail);
            mapped.ContactTelephone.Should().Be(testParticipant.ContactTelephone);
            mapped.DisplayName.Should().Be(testParticipant.DisplayName);
            mapped.FirstName.Should().Be(testParticipant.FirstName);
            mapped.HearingRole.Should().Be(testParticipant.HearingRole);
            mapped.LastName.Should().Be(testParticipant.LastName);
            mapped.Name.Should().Be(testParticipant.Name);
            mapped.Representee.Should().Be(testParticipant.Representee);
            mapped.Role.Should().Be(testParticipant.UserRole);
            mapped.Id.Should().Be(testParticipant.Id);

            mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipant>() { linkedParticipant1, linkedParticipant2 });
            linkedParticipantRequests.ForEach(linkedParticipant => linkedParticipantMapperMock.Verify(mapper => mapper.Map(linkedParticipant), Times.Once));
            linkedParticipantMapperMock.Verify(mapper => mapper.Map(It.IsAny<LinkedParticipantRequest>()), Times.Exactly(linkedParticipantRequests.Count));
        }
    }
}
