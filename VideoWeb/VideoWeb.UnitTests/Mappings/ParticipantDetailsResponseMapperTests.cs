using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework.Legacy;
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

            ClassicAssert.AreEqual(response.Username, participant.Username);
            ClassicAssert.AreEqual(response.CaseTypeGroup, participant.CaseTypeGroup);
            ClassicAssert.AreEqual(response.Id, participant.Id);
            ClassicAssert.AreEqual(response.FirstName, participant.FirstName);
            ClassicAssert.AreEqual(response.LastName, participant.LastName);
            ClassicAssert.AreEqual(response.ContactEmail, participant.ContactEmail);
            ClassicAssert.AreEqual(response.ContactTelephone, participant.ContactTelephone);
            ClassicAssert.AreEqual(Role.Individual, participant.Role);
            ClassicAssert.AreEqual(response.HearingRole, participant.HearingRole);
            ClassicAssert.AreEqual(ParticipantStatus.Available, participant.ParticipantStatus);
            ClassicAssert.AreEqual(response.DisplayName, participant.DisplayName);
            ClassicAssert.AreEqual(response.CaseTypeGroup, participant.CaseTypeGroup);
            ClassicAssert.AreEqual(response.RefId, participant.RefId);
            ClassicAssert.AreEqual(response.Representee, participant.Representee);
            ClassicAssert.AreEqual(LinkType.Interpreter, participant.LinkedParticipants.FirstOrDefault(x => x.LinkedId == linkedId).LinkType);
        }
    }
}
