using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class when_action_has_participantId : CheckParticipantCanAccessConferenceAttributeTest
    {
        [TestCaseSource(nameof(AllNonVhoUsers))]
        public async Task should_continue_with_other_middleware(string appRole)
        {
            // arrange
            var actionArguments = new Dictionary<string, object>
            {
                {"participantId", _participantId}
            };
            var user = _userBuilder.WithUsername(USER_NAME).WithRole(appRole).Build();
            SetupActionExecutingContext(actionArguments, user);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
