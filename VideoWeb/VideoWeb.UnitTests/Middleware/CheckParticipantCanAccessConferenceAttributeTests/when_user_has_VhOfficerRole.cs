using System.Collections.Generic;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_user_has_VhOfficerRole : CheckParticipantCanAccessConferenceAttributeTest
    {
        [Test]
        public void Should_continue_with_other_middleware()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>();

            var vhoUser = _userBuilder
                .WithUsername(USER_NAME)
                .WithRole(AppRoles.VhOfficerRole)
                .Build();

            SetupActionExecutingContext(actionArguments, vhoUser);

            // act
            _sut.OnActionExecuting(_actionExecutingContext);

            // assert
            _actionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
