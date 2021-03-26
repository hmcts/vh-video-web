using System.Collections.Generic;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_action_has_participantId : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public void Should_continue_with_other_middleware(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"participantId", _participantId}
            };
            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();
            SetupActionExecutingContext(actionArguments, user);

            // act
            _sut.OnActionExecuting(_actionExecutingContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
