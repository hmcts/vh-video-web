using System;
using System.Net;
using FluentAssertions;
using TechTalk.SpecFlow;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class ExecuteEventBuilder
    {
        private const string AlertTimeKey = "alert time";
        private readonly CallbackEndpoints _callbackEndpoints = new VideoApiUriFactory().CallbackEndpoints;
        private TestContext _context;
        private ScenarioContext _scenarioContext;
        private ConferenceEventRequest _request;

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

        public ExecuteEventBuilder WithRequest(ConferenceEventRequest request)
        {
            _request = request;
            return this;
        }

        public void Execute()
        {
            _context.Request = _context.Post(_callbackEndpoints.Event, _request);
            _context.Response = _context.VideoApiClient().Execute(_context.Request);
            _context.Response.StatusCode.Should().Be(HttpStatusCode.NoContent);
            _context.Response.IsSuccessful.Should().Be(true);
        }
    }
}
