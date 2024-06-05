using Autofac.Extras.Moq;
using FluentAssertions;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Mappings
{
    public class UpdateParticipantRequestToUpdateParticipantMapperTests
    {
            protected AutoMock _mocker;
            protected UpdateParticipantRequestToUpdateParticipantMapper _sut;

            private Mock<IMapTo<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>> linkedParticipantMapperMock;

            private LinkedParticipantRequest linkedParticipantRequest1;
            private LinkedParticipantRequest linkedParticipantRequest2;
            private List<LinkedParticipantRequest> linkedParticipantRequests;

            private LinkedParticipant linkedParticipant1;
            private LinkedParticipant linkedParticipant2;

            private UpdateParticipantRequest testUpdateParticipant;

            [SetUp]
            public void Setup()
            {
                linkedParticipantRequest1 = new LinkedParticipantRequest() { LinkedRefId = Guid.NewGuid() };
                linkedParticipantRequest2 = new LinkedParticipantRequest() { LinkedRefId = Guid.NewGuid() };
                linkedParticipantRequests = new List<LinkedParticipantRequest>() { linkedParticipantRequest1, linkedParticipantRequest2 };
                linkedParticipant1 = new LinkedParticipant() { LinkedId = linkedParticipantRequest1.LinkedRefId };
                linkedParticipant2 = new LinkedParticipant() { LinkedId = linkedParticipantRequest2.LinkedRefId };
                linkedParticipantMapperMock = new Mock<IMapTo<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>>();
                linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipantRequest1, It.IsAny<IEnumerable<Participant>>())).Returns(linkedParticipant1);
                linkedParticipantMapperMock.Setup(mapper => mapper.Map(linkedParticipantRequest2, It.IsAny<IEnumerable<Participant>>())).Returns(linkedParticipant2);

                _mocker = AutoMock.GetLoose();
                _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LinkedParticipantRequest, IEnumerable<Participant>, LinkedParticipant>()).Returns(linkedParticipantMapperMock.Object);
                _sut = _mocker.Create<UpdateParticipantRequestToUpdateParticipantMapper>();

                testUpdateParticipant = new UpdateParticipantRequest()
                {
                    ContactEmail = "TestContactEmail",
                    ContactTelephone = "TestContactTelephone",
                    DisplayName = "TestDisplayName",
                    FirstName = "TestFirstName",
                    LastName = "TestLastName",
                    LinkedParticipants = linkedParticipantRequests,
                    Fullname = "TestFullName",
                    Representee = "TestRepresentee",
                    Username = "TestUsername",
                    ParticipantRefId = Guid.NewGuid(),
                };

            }

            [Test]
            public void Should_map_correctly()
            {
                var existingParticipants = new List<Participant>() { new Participant() { Id = Guid.NewGuid() } };
                var mapped = _sut.Map(testUpdateParticipant, existingParticipants);

                mapped.ContactEmail.Should().Be(testUpdateParticipant.ContactEmail);
                mapped.ContactTelephone.Should().Be(testUpdateParticipant.ContactTelephone);
                mapped.DisplayName.Should().Be(testUpdateParticipant.DisplayName);
                mapped.FirstName.Should().Be(testUpdateParticipant.FirstName);
                mapped.Fullname.Should().Be(testUpdateParticipant.Fullname);
                mapped.LastName.Should().Be(testUpdateParticipant.LastName);
                mapped.Representee.Should().Be(testUpdateParticipant.Representee);
                mapped.ParticipantRefId.Should().Be(testUpdateParticipant.ParticipantRefId);

                mapped.LinkedParticipants.Should().BeEquivalentTo(new List<LinkedParticipant>() { linkedParticipant1, linkedParticipant2 });
                linkedParticipantRequests.ForEach(linkedParticipant => linkedParticipantMapperMock.Verify(mapper => mapper.Map(linkedParticipant, existingParticipants), Times.Once));
                linkedParticipantMapperMock.Verify(mapper => mapper.Map(It.IsAny<LinkedParticipantRequest>(), existingParticipants), Times.Exactly(linkedParticipantRequests.Count));
            }
        
    }
}
