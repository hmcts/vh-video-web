using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.EventHub.Services;
using Autofac.Extras.Moq;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public abstract class ConferenceManagementControllerTestBase
    {
        protected AutoMock _mocker;
        protected Conference TestConference;

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

            _mocker.Mock<IConferenceCache>().Setup(x =>
                x.GetOrAddConferenceAsync(TestConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
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
