using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_action_has_neither_participantId_or_conferenceId
        : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task Should_continue_with_other_middleware(string appRole)
        {
            // arrange
            var user = UserBuilder.WithUsername(UserName).WithRole(appRole).Build();

            SetupActionExecutingContext(new Dictionary<string, object>(), user);

            // act
            await Sut.OnActionExecutionAsync(ActionExecutingContext, () => Task.FromResult(ActionExecutedContext));

            // assert
            ActionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
