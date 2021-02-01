using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class when_action_has_participantId : CheckParticipantCanAccessConferenceAttributeTest
    {
        [Test]
        public async Task should_continue_with_other_middleware()
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
    }
}
