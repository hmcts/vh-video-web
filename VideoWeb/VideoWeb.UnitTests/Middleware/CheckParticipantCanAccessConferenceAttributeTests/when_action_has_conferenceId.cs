using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_action_has_conferenceId : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task Should_return_404_if_conference_does_not_exist(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", ConferenceId}
            };

            var user = UserBuilder.WithUsername(UserName).WithRole(appRole).Build();

            ConferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                // conference doesn't exist (null)
                .ReturnsAsync((Conference)null);

            SetupActionExecutingContext(actionArguments, user);

            // act
            await Sut.OnActionExecutionAsync(ActionExecutingContext, () => Task.FromResult(ActionExecutedContext));

            // assert
            ActionExecutingContext.Result.Should().BeOfType<NotFoundObjectResult>();
            ActionExecutingContext.ModelState.ErrorCount.Should().Be(1);
            var message404 = $"Conference with id:'{ConferenceId}' not found.";
            ActionExecutingContext.ModelState["CheckParticipantCanAccessConference"]
                .Errors.First().ErrorMessage
                .Should().Be(message404);
        }

        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task Should_return_401_if_conference_exists_but_user_does_not_belong_to_it(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", ConferenceId}
            };

            var user = UserBuilder.WithUsername(UserName).WithRole(appRole).Build();

            var participantId = Guid.NewGuid();
            var conference = new Conference
            {
                // conference exists...
                Id = ConferenceId,
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
            ConferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user);

            // act
            await Sut.OnActionExecutionAsync(ActionExecutingContext, () => Task.FromResult(ActionExecutedContext));

            // assert
            ActionExecutingContext.Result.Should().BeOfType<UnauthorizedObjectResult>();
            ActionExecutingContext.ModelState.ErrorCount.Should().Be(1);
            var message401 = "User does not belong to this conference.";
            ActionExecutingContext.ModelState["CheckParticipantCanAccessConference"]
                .Errors.First().ErrorMessage
                .Should().Be(message401);
        }

        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task Should_continue_with_other_middleware_if_conference_exists_and_conference_contains_participantId(
                string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"conferenceId", ConferenceId}
            };

            var user = UserBuilder.WithUsername(UserName).WithRole(appRole).Build();

            var conference = new Conference
            {
                // conference exists...
                Id = ConferenceId,
                Participants = new List<Participant>
                {
                    new Participant
                    {
                        // ...and user is a part of it
                        Username = UserName,
                        Id = ParticipantId
                    }
                }
            };

            ConferenceCache.Setup(x => x.GetOrAddConferenceAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);

            SetupActionExecutingContext(actionArguments, user);

            // act
            await Sut.OnActionExecutionAsync(ActionExecutingContext, () => Task.FromResult(ActionExecutedContext));

            // assert
            ActionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
