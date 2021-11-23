using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class When_user_has_VhOfficerRole : CheckParticipantCanAccessConferenceAttributeTest
    {
        [Test]
        public async Task Should_continue_with_other_middleware()
        {
            // arrange
            var actionArguments = new Dictionary<string, object>();

            var vhoUser = UserBuilder
                .WithUsername(UserName)
                .WithRole(AppRoles.VhOfficerRole)
                .Build();

            SetupActionExecutingContext(actionArguments, vhoUser);

            // act
            await Sut.OnActionExecutionAsync(ActionExecutingContext, () => Task.FromResult(ActionExecutedContext));

            // assert
            ActionExecutingContext.Result.Should().BeOfType<OkResult>();
        }
    }
}
