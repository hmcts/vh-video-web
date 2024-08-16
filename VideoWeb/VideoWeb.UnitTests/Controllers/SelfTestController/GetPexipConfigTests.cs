using System.Net;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = Microsoft.AspNetCore.Mvc.ProblemDetails;
using System.Threading.Tasks;

namespace VideoWeb.UnitTests.Controllers.SelfTestController
{
    public class GetPexipConfigTests
    {
        private AutoMock _mocker;
        private VideoWeb.Controllers.SelfTestController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            _sut = _mocker.Create<VideoWeb.Controllers.SelfTestController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok_with_pexipnode()
        {
            var result = await _sut.GetPexipConfig();
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_not_found_code_when_config_is_not_found()
        {
            var apiException = new VideoApiException<ProblemDetails>("User not found", (int)HttpStatusCode.NotFound,
                "Config Not Found", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetPexipServicesConfigurationAsync())
                .Throws(apiException);

            var result = await _sut.GetPexipConfig();
            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }
    }
}
