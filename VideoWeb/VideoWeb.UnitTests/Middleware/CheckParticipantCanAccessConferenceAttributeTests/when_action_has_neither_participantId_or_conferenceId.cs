using System.Collections.Generic;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_action_has_neither_participantId_or_conferenceId
        : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public void Should_continue_with_other_middleware(string appRole)
        {
            // arrange
            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();

            SetupActionExecutingContext(new Dictionary<string, object>(), user);

            // act
            _sut.OnActionExecuting(_actionExecutingContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
