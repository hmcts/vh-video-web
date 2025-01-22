using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using Autofac.Extras.Moq;
using VideoWeb.Common;
using Bogus;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public abstract class ConferenceManagementControllerTestBase
    {
        protected AutoMock _mocker;
        protected Conference TestConference;
        private static readonly Faker Faker = new();

        protected ConferenceManagementController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            _mocker = AutoMock.GetLoose();
            var sut = _mocker.Create<ConferenceManagementController>();
            sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(TestConference);

            return sut;
        }
        
        protected static Conference BuildConferenceForTest(bool withWitnessRoom = false)
        {
            var conference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .With(x => x.Username = Faker.Internet.Email("judge"))
                        .With(x => x.HearingRole = "Judge")
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email("individual1"))
                        .With(x => x.HearingRole = "Litigant in person")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email("representative1"))
                        .With(x => x.HearingRole = "Professional")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email("individual2"))
                        .With(x => x.HearingRole = "Litigant in person")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email("representative2"))
                        .With(x => x.HearingRole = "Professional")
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.HearingRole = "Witness")
                        .With(x => x.Username = Faker.Internet.Email("witness1"))
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.StaffMember)
                        .With(x => x.HearingRole = "Staff Member")
                        .With(x => x.Username = Faker.Internet.Email("witness1"))
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.QuickLinkObserver)
                        .With(x => x.HearingRole = "Quick link observer")
                        .With(x => x.Username = Faker.Internet.Email("quicklinkobserver1"))
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.QuickLinkParticipant)
                        .With(x => x.HearingRole = "Quick link participant")
                        .With(x => x.Username = Faker.Internet.Email("quicklinkparticipant1"))
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };

            if (!withWitnessRoom) return conference;

            var witnessInRoom = Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                .With(x => x.HearingRole = "Witness")
                .With(x => x.Username = Faker.Internet.Email("witness2"))
                .With(x => x.Id = Guid.NewGuid()).Build();
            
            var witnessInterpreter = Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                .With(x => x.HearingRole = "Interpreter")
                .With(x => x.Username = Faker.Internet.Email("interpreter"))
                .With(x => x.Id = Guid.NewGuid()).Build();

            witnessInRoom.LinkedParticipants = new List<LinkedParticipant>
                {new LinkedParticipant {LinkedId = witnessInterpreter.Id, LinkType = LinkType.Interpreter}};
            
            witnessInterpreter.LinkedParticipants = new List<LinkedParticipant>
                {new LinkedParticipant {LinkedId = witnessInRoom.Id, LinkType = LinkType.Interpreter}};
            var witnessParticipants = new List<Participant> {witnessInRoom, witnessInterpreter};
            var room = new CivilianRoom
                {Id = 1234, RoomLabel = "Interpreter1", Participants = witnessParticipants.Select(x => x.Id).ToList()};
            conference.CivilianRooms.Add(room);
            conference.Participants.AddRange(witnessParticipants);
            return conference;
        }
    }
}
