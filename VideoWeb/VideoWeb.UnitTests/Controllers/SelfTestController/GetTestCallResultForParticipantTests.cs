using System;
using System.Net;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.SelfTestController
{
    public class GetTestCallResultForParticipantTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.SelfTestController _controller;
        private ClaimsPrincipal _claimsPrincipal;
        private TestCallCache _testCallCache;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            _testCallCache = new TestCallCache(memoryCache);
            
            _claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = _claimsPrincipal
                }
            };

            _controller = _mocker.Create<VideoWeb.Controllers.SelfTestController>(new TypedParameter(typeof(ITestCallCache), _testCallCache));
            _controller.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok_when_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var conferenceId = Guid.NewGuid();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetTestCallResultForParticipantAsync(conferenceId, participantId, CancellationToken.None))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetTestCallResultForParticipantAsync(conferenceId, participantId, CancellationToken.None);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
            _testCallCache.HasUserCompletedATestToday(_claimsPrincipal.Identity.Name).Result.Should().BeTrue();
        }

        [Test]
        public async Task Should_return_ok_when_independent_testcall_result_returned()
        {
            var testCallResponse = Builder<TestCallScoreResponse>.CreateNew().Build();
            var participantId = Guid.NewGuid();
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetIndependentTestCallResultAsync(participantId, CancellationToken.None))
                .Returns(Task.FromResult(testCallResponse));

            var result = await _controller.GetIndependentTestCallResultAsync(participantId, CancellationToken.None);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().BeEquivalentTo(testCallResponse);
            _testCallCache.HasUserCompletedATestToday(_claimsPrincipal.Identity.Name).Result.Should().BeTrue();
        }
    }
}
