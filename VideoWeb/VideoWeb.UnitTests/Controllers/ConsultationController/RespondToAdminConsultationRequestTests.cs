using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using Testing.Common.Helpers;
using VideoWeb.Controllers;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class RespondToAdminConsultationRequestTests
    {
        private ConsultationsController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = new ConsultationsController(_videoApiClientMock.Object)
            {
                ControllerContext = context
            };
        }
        
        [Test]
        public async Task should_return_no_content_when_request_is_sent()
        {
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var result = await _controller.RespondToAdminConsultationRequest(Builder<AdminConsultationRequest>.CreateNew().Build());
            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }
        
        [Test]
        public async Task should_return_status_code_with_message_when_not_successful()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default(ProblemDetails), null);
            
            _videoApiClientMock
                .Setup(x => x.RespondToAdminConsultationRequestAsync(It.IsAny<AdminConsultationRequest>()))
                .ThrowsAsync(apiException);
            
            var result = await _controller.RespondToAdminConsultationRequest(Builder<AdminConsultationRequest>.CreateNew().Build());
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

    }
}