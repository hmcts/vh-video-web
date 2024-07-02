using System;
using System.Collections.Generic;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Middleware;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class CheckParticipantCanAccessConferenceAttributeTest
    {
        private Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>> _logger;
        protected Mock<IConferenceService> ConferenceService;
        protected CheckParticipantCanAccessConferenceAttribute Sut;
        protected readonly Guid ParticipantId = Guid.NewGuid();
        protected readonly Guid ConferenceId = Guid.NewGuid();
        protected ActionExecutingContext ActionExecutingContext;
        protected ActionExecutedContext ActionExecutedContext;
        protected ClaimsPrincipalBuilder UserBuilder;
        protected const string UserName = "some-user-name";

        [SetUp]
        public void SetUp()
        {
            _logger = new Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>>();
            ConferenceService = new Mock<IConferenceService>();
            Sut = new CheckParticipantCanAccessConferenceAttribute(_logger.Object, ConferenceService.Object);
            UserBuilder = new ClaimsPrincipalBuilder();
        }

        protected void SetupActionExecutingContext(
            IDictionary<string, object> actionArguments = null,
            ClaimsPrincipal user = null
        )
        {
            var httpContextMock = new DefaultHttpContext();

            if (user != null) httpContextMock.User = user;

            var modelState = new ModelStateDictionary();
            var actionContext = new ActionContext(
                httpContextMock,
                Mock.Of<RouteData>(),
                Mock.Of<ActionDescriptor>(),
                modelState
            );

            ActionExecutingContext = new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                actionArguments ?? new Dictionary<string, object>(),
                Mock.Of<Controller>())
            {
                Result = new OkResult()
            };

            ActionExecutedContext =
                new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), Mock.Of<Controller>());
        }

        protected static IEnumerable<TestCaseData> AllNonVhoUsers()
        {
            var retList = new List<TestCaseData>
            {
                new TestCaseData(AppRoles.CaseAdminRole),
                new TestCaseData(AppRoles.CitizenRole),
                new TestCaseData(AppRoles.JudgeRole),
                new TestCaseData(AppRoles.JudicialOfficeHolderRole),
                new TestCaseData(AppRoles.RepresentativeRole),
            };

            retList.Count.Should().Be(5, "there is an AppRole missing from this test");

            return retList;
        }
    }
}
