using System;
using System.Collections.Generic;
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
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    public abstract class ConferenceManagementControllerTestBase
    {
        protected Conference TestConference;
        protected ConferenceManagementController Controller;
        protected Mock<IVideoApiClient> VideoApiClientMock;
        private Mock<ILogger<ConferenceManagementController>> _mockLogger;
        private Mock<IConferenceCache> _conferenceCache;

        protected ConferenceManagementController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            BaseSetup();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            return new ConferenceManagementController(VideoApiClientMock.Object, _mockLogger.Object,
                _conferenceCache.Object)
            {
                ControllerContext = context
            };
        }
        
        private void BaseSetup()
        {
            _conferenceCache = new Mock<IConferenceCache>();
            VideoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<ConferenceManagementController>>();

            _conferenceCache.Setup(x =>
                    x.GetOrAddConferenceAsync(TestConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(TestConference);
        }

        protected static Conference BuildConferenceForTest()
        {
            return new Conference
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
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.HearingRole = "Witness")
                        .With(x => x.Username = Faker.Internet.Email("witness1"))
                        .With(x => x.Id = Guid.NewGuid()).Build()
                }
            };
        }
    }
}
