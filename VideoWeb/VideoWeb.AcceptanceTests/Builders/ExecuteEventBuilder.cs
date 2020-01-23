using System;
using System.Net;
using AcceptanceTests.Common.Api.Uris;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class ExecuteEventBuilder
    {
        private const string AlertTimeKey = "alert time";
        private readonly VideoEventsEndpoints _videoApiVideoEventsEndpoints = new VideoApiUriFactory().VideoEventsEndpoints;
        private readonly VideoWebCallbackEndpoints _videoWebCallbackEndpoints = new VideoWebUriFactory().CallbackEndpoints;
        private TestContext _context;
        private ScenarioContext _scenarioContext;
        private CallbackEvent _request;

        public ExecuteEventBuilder WithContext(TestContext context)
        {
            _context = context;
            return this;
        }

        public ExecuteEventBuilder WithScenarioContext(ScenarioContext scenarioContext)
        {
            _scenarioContext = scenarioContext;
            _scenarioContext.Add(AlertTimeKey, DateTime.Now);
            return this;
        }

        public ExecuteEventBuilder WithRequest(CallbackEvent request)
        {
            _request = request;
            return this;
        }

        public void SendToVideoApi()
        {
            _context.Request = _context.Post(_videoApiVideoEventsEndpoints.Event, _request);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }

        public void SendToVideoWeb()
        {
            _context.SetCustomJwTokenForCallback();
            _context.Request = _context.Post(_videoWebCallbackEndpoints.Event, _request);
            _context.Response = _context.VideoWebEventCallbackClient().Execute(_context.Request);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }
    }
}
