using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class when_user_has_VhOfficerRole : CheckParticipantCanAccessConferenceAttributeTest
    {
        [Test]
        public async Task should_continue_with_other_middleware()
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
    }
}
