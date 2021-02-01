using System;
using System.Collections.Generic;
using System.Security.Claims;
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
using VideoWeb.Middleware;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Middleware.CheckParticipantCanAccessConferenceAttributeTests
{
    public class CheckParticipantCanAccessConferenceAttributeTest
    {
        protected Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>> _logger;
        protected Mock<IConferenceCache> _conferenceCache;
        protected Mock<IVideoApiClient> _videoApiClient;
        protected CheckParticipantCanAccessConferenceAttribute _sut;
        protected readonly Guid _participantId = Guid.NewGuid();
        protected readonly Guid _conferenceId = Guid.NewGuid();
        protected ActionExecutingContext _actionExecutingContext;
        protected ActionExecutedContext _actionExecutedContext;
        protected const string USER_NAME = "some-user-name";

        [SetUp]
        public void SetUp()
        {
            _logger = new Mock<ILogger<CheckParticipantCanAccessConferenceAttribute>>();
            _conferenceCache = new Mock<IConferenceCache>();
            _videoApiClient = new Mock<IVideoApiClient>();
            _sut = new CheckParticipantCanAccessConferenceAttribute(
                _logger.Object,
                _conferenceCache.Object,
                _videoApiClient.Object
            );
        }

        protected void SetupActionExecutingContext(
            IDictionary<string, object> actionArguments = null,
            ClaimsPrincipal user = null
        )
        {
            var httpContextMock = new DefaultHttpContext();

            if (user != null)
            {
                httpContextMock.User = user;
            }

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

            _actionExecutedContext = new ActionExecutedContext(actionContext, new List<IFilterMetadata>(), Mock.Of<Controller>());
        }
    }
}
