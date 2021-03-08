using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class when_action_has_conferenceId : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task should_return_404_if_conference_does_not_exist(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", _conferenceId}
            };

            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();

            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                // conference doesn't exist (null)
                .ReturnsAsync((Conference)null);

            SetupActionExecutingContext(actionArguments, user);

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

        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task should_return_401_if_conference_exists_but_user_does_not_belong_to_it(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", _conferenceId}
            };

            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();

            var participantId = Guid.NewGuid();
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
                        Id = participantId
                    }
                }
            };
            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<UnauthorizedObjectResult>();
            _actionExecutingContext.ModelState.ErrorCount.Should().Be(1);
            var message401 = "User does not belong to this conference.";
            _actionExecutingContext.ModelState["CheckParticipantCanAccessConference"]
                .Errors.First().ErrorMessage
                .Should().Be(message401);
        }

        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task
            should_continue_with_other_middleware_if_conference_exists_and_conference_contains_participantId(
                string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", _conferenceId}
            };

            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();

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
                        Id = _participantId
                    }
                }
            };

            _conferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
