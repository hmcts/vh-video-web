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
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Middleware;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceFilterTests
{
    public class CheckParticipantCanAccessConferenceFilterTest
    {
        protected Mock<ILogger<CheckParticipantCanAccessConferenceFilter>> _logger;
        protected Mock<IConferenceCache> _conferenceCache;
        protected Mock<IVideoApiClient> _videoApiClient;
        protected CheckParticipantCanAccessConferenceFilter _sut;
        protected readonly Guid _participantId = Guid.NewGuid();
        protected readonly Guid _conferenceId = Guid.NewGuid();
        protected ActionExecutingContext _actionExecutingContext;
        protected ActionExecutedContext _actionExecutedContext;
        protected ClaimsPrincipalBuilder _userBuilder;
        protected const string USER_NAME = "some-user-name";

        [SetUp]
        public void SetUp()
        {
            _logger = new Mock<ILogger<CheckParticipantCanAccessConferenceFilter>>();
            _conferenceCache = new Mock<IConferenceCache>();
            _videoApiClient = new Mock<IVideoApiClient>();
            _sut = new CheckParticipantCanAccessConferenceFilter(
                _logger.Object,
                _conferenceCache.Object,
                _videoApiClient.Object
            );

            _userBuilder = new ClaimsPrincipalBuilder();
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

            _actionExecutingContext = new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                actionArguments ?? new Dictionary<string, object>(),
                Mock.Of<Controller>())
            {
                Result = new OkResult()
            };

            _actionExecutedContext =
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

                new TestCaseData(AppRoles.RepresentativeRole)
            };

            retList.Count.Should().Be(5, "there is an AppRole missing from this test");

            return retList;
        }
    }
}
