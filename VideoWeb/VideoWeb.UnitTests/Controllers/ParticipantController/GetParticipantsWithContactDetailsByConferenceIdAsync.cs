using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.User.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetParticipantsWithContactDetailsByConferenceIdAsyncTests
    {
        private EventComponentHelper _eventComponentHelper;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<ParticipantsController>> _mockLogger;
        private Mock<IConferenceCache> _mockConferenceCache;
        private List<Participant> _participants;
        private ParticipantsController _controller;

        [SetUp]
        public void Setup()
        {
            _eventComponentHelper = new EventComponentHelper();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<ParticipantsController>>(MockBehavior.Loose);
            _mockConferenceCache = new Mock<IConferenceCache>();

            var judge = CreateParticipant("Judge", "Judge");
            var individual = CreateParticipant("Individual", "Claimant");
            var representative = CreateParticipant("Representative", "Defendant");
            _participants = new List<Participant>
            {
                judge, individual, representative
            };

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }
        
        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge3DifferentHearing = CreateParticipant("judge3", "Judge");
            conference.Participants = _participants;

            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = _participants[2].Username, Status = ParticipantState.InHearing }
            };

            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);
            _videoApiClientMock
                .Setup(x => x.GetJudgesInHearingsTodayAsync())
                .ReturnsAsync(judgesInHearings);

            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(conference.Id);
            var typedResult = result as OkObjectResult;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().NotBeNull();
            typedResult.Value.Should().BeAssignableTo<IEnumerable<ParticipantContactDetailsResponseVho>>();
            var results = ((IEnumerable<ParticipantContactDetailsResponseVho>)typedResult.Value).ToList();
            results.Should().NotBeNullOrEmpty();
            results.Count.Should().Be(3);

            AssertResponseItem(results.ElementAt(0), conference.Participants[1], conferenceId, false);
            AssertResponseItem(results.ElementAt(1), conference.Participants[2], conferenceId, true);
            AssertResponseItem(results.ElementAt(2), conference.Participants[0], conferenceId, false);
        }

        [Test]
        public async Task Should_return_bad_request_when_conferenceId_empty()
        {
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(Guid.Empty);
            
            var typedResult = (BadRequestObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_return_unauthorised_when_user_not_in_vho_role()
        {
            var errorMessage = "User must be a VH Officer";
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.Individual).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(Guid.NewGuid());
            
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
            typedResult.Value.Should().Be(errorMessage);
        }
        
        [Test]
        public async Task Should_throw_error_when_get_video_api_throws_error()
        {
            var conferenceId = Guid.NewGuid();
            
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id and participant Id", null, default, null);
            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ThrowsAsync(apiException);
        
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant, 
            Guid conferenceId, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().Be(participant.FirstName);
            response.LastName.Should().Be(participant.LastName);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().Be(participant.ContactEmail);
            response.ContactTelephone.Should().Be(participant.ContactTelephone);
            response.HearingVenueName.Should().Be("MyVenue");
            response.JudgeInAnotherHearing.Should().Be(isInAnotherHearing);
        }
        
        private static Participant CreateParticipant(string username, string caseTypeGroup)
        {
            return Builder<Participant>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Name = username)
                .With(x => x.Role = Role.Judge)
                .With(x => x.Username = username)
                .With(x => x.CaseTypeGroup = caseTypeGroup)
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.DisplayName = $"{username} {username}")
                .Build();
        }

        private static Conference CreateValidConference(Guid conferenceId)
        {
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.HearingId = Guid.NewGuid())
                .With(x => x.HearingVenueName = "MyVenue")
                .Build();
            
            return conference;
        }
        
        private ParticipantsController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var eventHandlerFactory = new EventHandlerFactory(_eventComponentHelper.GetHandlers());
            return new ParticipantsController(_videoApiClientMock.Object, eventHandlerFactory, _mockConferenceCache.Object, 
                _mockLogger.Object)
            {
                ControllerContext = context
            };
        }
    }
}
