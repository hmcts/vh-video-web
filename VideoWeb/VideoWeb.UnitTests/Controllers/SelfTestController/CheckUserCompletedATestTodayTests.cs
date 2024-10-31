using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.SelfTestController;

public class CheckUserCompletedATestTodayTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.SelfTestController _controller;
    private ClaimsPrincipal _claimsPrincipal;
    private TestCallCache _testCallCache;
    private string _username;

    [SetUp]
    public void Setup()
    {
        _username = $"{Guid.NewGuid()}@test.net";
        _mocker = AutoMock.GetLoose();

        var memoryCache = new MemoryCache(new MemoryCacheOptions());
        _testCallCache = new TestCallCache(memoryCache);

        _claimsPrincipal = new ClaimsPrincipalBuilder().WithUsername(_username).Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = _claimsPrincipal
            }
        };

        _controller =
            _mocker.Create<VideoWeb.Controllers.SelfTestController>(new TypedParameter(typeof(ITestCallCache),
                _testCallCache));
        _controller.ControllerContext = context;
    }

    [Test]
    public async Task should_return_ok_true_when_user_has_completed_a_test_call_today()
    {
        await _testCallCache.AddTestCompletedForTodayAsync(_username);
        var result = await _controller.CheckUserCompletedATestTodayAsync();
        result.Should().BeOfType<OkResult>().Which.Should().Be(true);
    }

    [Test]
    public async Task should_return_ok_false_when_user_has_not_completed_a_test_call_today()
    {
        var result = await _controller.CheckUserCompletedATestTodayAsync();
        result.Should().BeOfType<OkResult>().Which.Should().Be(false);
    }

}
