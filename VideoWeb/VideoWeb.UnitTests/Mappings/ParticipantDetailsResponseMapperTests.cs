using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantDetailsResponseMapperTests
    {
        [Test]
        public void Maps_Participant_From_Response()
        {
            var linkedId = Guid.NewGuid();
            var mapper = new ParticipantDetailsResponseMapper();
            var response = new ParticipantDetailsResponse
            {
                CaseTypeGroup = "CaseTypeGroup",
                ContactEmail = "john.doe@hmcts.net",
                ContactTelephone = "0984757587",
                CurrentInterpreterRoom = new RoomResponse(),
                CurrentRoom = new RoomResponse(),
                CurrentStatus = ParticipantState.Available,
                DisplayName = "john",
                FirstName = "John",
                HearingRole = "Hearing role",
                Id = Guid.NewGuid(),
                LastName = "Doe",
                LinkedParticipants = new List<LinkedParticipantResponse>
                {
                    new LinkedParticipantResponse
                    {
                        LinkedId = linkedId,
                        Type = LinkedParticipantType.Interpreter
                    }
                },
                Name = "John@Doe",
                RefId = Guid.NewGuid(),
                Representee = "Jane",
                Username = "john55",
                UserRole = UserRole.Individual
            };

            var participant = mapper.Map(response);

            Assert.AreEqual(response.Username, participant.Username);
            Assert.AreEqual(response.CaseTypeGroup, participant.CaseTypeGroup);
            Assert.AreEqual(response.Id, participant.Id);
            Assert.AreEqual(response.FirstName, participant.FirstName);
            Assert.AreEqual(response.LastName, participant.LastName);
            Assert.AreEqual(response.ContactEmail, participant.ContactEmail);
            Assert.AreEqual(response.ContactTelephone, participant.ContactTelephone);
            Assert.AreEqual(Role.Individual, participant.Role);
            Assert.AreEqual(response.HearingRole, participant.HearingRole);
            Assert.AreEqual(ParticipantStatus.Available, participant.ParticipantStatus);
            Assert.AreEqual(response.DisplayName, participant.DisplayName);
            Assert.AreEqual(response.CaseTypeGroup, participant.CaseTypeGroup);
            Assert.AreEqual(response.RefId, participant.RefId);
            Assert.AreEqual(response.Representee, participant.Representee);
            Assert.AreEqual(LinkType.Interpreter, participant.LinkedParticipants.FirstOrDefault(x => x.LinkedId == linkedId).LinkType);
        }
    }
}
