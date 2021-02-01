using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Middleware;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Middleware
{
    public class CheckParticipantCanAccessConferenceAttributeTests
    {
        private Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>> _logger;
        private Mock<IConferenceCache> _conferenceCache;
        private Mock<IVideoApiClient> _videoApiClient;
        private CheckParticipantCanAccessConferenceAttribute _sut;
        private readonly Guid _participantId = Guid.NewGuid();
        private readonly Guid _conferenceId = Guid.NewGuid();
        private ActionExecutingContext _actionExecutingContext;
        private ActionExecutedContext _actionExecutedContext;
        private const string USER_NAME = "some-user-name";

        [SetUp]
        public void SetUp()
        {
            _logger = new Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>>();
            _conferenceCache = new Mock<IConferenceCache>();
            _videoApiClient = new Mock<IVideoApiClient>();
            _sut = new CheckParticipantCanAccessConferenceAttribute(
                _logger.Object,
                _conferenceCache.Object,
                _videoApiClient.Object
            );
        }

        private void SetupActionExecutingContext(
            IDictionary<string, object> actionArguments = null,
            ClaimsPrincipal user = null
        )
        {
            var httpContextMock = new DefaultHttpContext();

            if (user != null)
            {
                httpContextMock.User = user;
            }

            var modelState = new ModelStateDictionary();
            var actionContext = new ActionContext(
                httpContextMock,
                Mock.Of<RouteData>(),
                Mock.Of<ActionDescriptor>(),
                modelState
            );

            _actionExecutingContext = new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                actionArguments ?? new Dictionary<string, object>(),
                Mock.Of<Controller>())
            {
                Result = new OkResult()
            };

            _actionExecutedContext = new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), Mock.Of<Controller>());
        }

        [Test]
        public async Task should_continue_with_other_middleware_if_participant_has_VhOfficerRole()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>();

            var user = new Mock<ClaimsPrincipal>();
            user.Setup(x => x.IsInRole(AppRoles.VhOfficerRole)).Returns(true);

            SetupActionExecutingContext(actionArguments, user.Object);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }

        [Test]
        public async Task should_continue_with_other_middleware_if_participantId_and_conferenceId_are_missing_from_url()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>();
            SetupActionExecutingContext(actionArguments);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }

        [Test]
        public async Task should_continue_with_other_middleware_if_participantId_is_missing_from_url()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                { "conferenceId", _conferenceId }
            };
            SetupActionExecutingContext(actionArguments);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }

        [Test]
        public async Task should_continue_with_other_middleware_if_conferenceId_is_missing_from_url()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                { "participantId", _participantId }
            };
            SetupActionExecutingContext(actionArguments);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }

        [Test]
        public async Task should_return_404_if_conference_does_not_exist()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                { "participantId", _participantId },
                { "conferenceId", _conferenceId }
            };

            var user = new Mock<ClaimsPrincipal>();
            var mockIdentity = new Mock<ClaimsIdentity>();
            mockIdentity.Setup(x => x.Name).Returns(USER_NAME);
            user.Setup(x => x.Identity).Returns(mockIdentity.Object);

            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
               // conference doesn't exist (null)
               .ReturnsAsync((Conference)null);

            SetupActionExecutingContext(actionArguments, user.Object);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<NotFoundObjectResult>();
            _actionExecutingContext.ModelState.ErrorCount.Should().Be(1);
            var message404 = $"Conference with id:'{_conferenceId}' not found.";
            _actionExecutingContext.ModelState["CheckParticipantCanAccessConference"]
                .Errors.First().ErrorMessage
                .Should().Be(message404);
        }

        [Test]
        public async Task should_return_401_if_conference_exists_but_user_does_not_belong_to_it()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                { "participantId", _participantId },
                { "conferenceId", _conferenceId }
            };

            var user = new Mock<ClaimsPrincipal>();
            var mockIdentity = new Mock<ClaimsIdentity>();
            mockIdentity.Setup(x => x.Name).Returns(USER_NAME);
            user.Setup(x => x.Identity).Returns(mockIdentity.Object);

            var conference = new Conference
            {
                // conference exists...
                Id = _conferenceId,
                Participants = new List<Participant>
                {
                    new Participant
                    {
                        // ...but user does not belong to it
                        Username = "Username",
                        Id = Guid.NewGuid()
                    }
                }
            };
            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user.Object);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<UnauthorizedObjectResult>();
            _actionExecutingContext.ModelState.ErrorCount.Should().Be(1);
            var message401 = $"Participant '{_participantId}' is not allowed to call this action.";
            _actionExecutingContext.ModelState["CheckParticipantCanAccessConference"]
                .Errors.First().ErrorMessage
                .Should().Be(message401);
        }

        [Test]
        public async Task should_continue_with_other_middleware_if_conference_exists_and_conference_contains_participantId()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                { "participantId", _participantId },
                { "conferenceId", _conferenceId }
            };

            var user = new Mock<ClaimsPrincipal>();
            var mockIdentity = new Mock<ClaimsIdentity>();
            mockIdentity.Setup(x => x.Name).Returns(USER_NAME);
            user.Setup(x => x.Identity).Returns(mockIdentity.Object);

            var conference = new Conference
            {
                // conference exists...
                Id = _conferenceId,
                Participants = new List<Participant>
                {
                    new Participant
                    {
                        // ...and user is a part of it
                        Username = USER_NAME,
                        Id = _participantId,
                    }
                }
            };

            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user.Object);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
