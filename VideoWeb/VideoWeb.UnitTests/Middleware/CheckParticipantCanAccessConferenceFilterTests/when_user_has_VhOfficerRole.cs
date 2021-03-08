using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceFilterTests
{
    public class when_user_has_VhOfficerRole : CheckParticipantCanAccessConferenceFilterTest
    {
        [Test]
        public async Task should_continue_with_other_middleware()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>();

            var vhoUser = _userBuilder
                .WithUsername(USER_NAME)
                .WithRole(AppRoles.VhOfficerRole)
                .Build();

            SetupActionExecutingContext(actionArguments, vhoUser);

            // act
            await _sut.OnActionExecutionAsync(_actionExecutingContext, async () => _actionExecutedContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
