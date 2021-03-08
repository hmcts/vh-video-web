using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceFilterTests
{
    public class when_action_has_neither_participantId_or_conferenceId
        : CheckParticipantCanAccessConferenceFilterTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task should_continue_with_other_middleware(string appRole)
        {
            // arrange
            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();

            SetupActionExecutingContext(new Dictionary<string, object>(), user);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
