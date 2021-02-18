using System;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class LockConsultationRoomRequestTests
    {
        private AutoMock _mocker;
        private ConsultationsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConference = ConsultationHelper.BuildConferenceForTest();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LockConsultationRoomRequest, LockRoomRequest>()).Returns(_mocker.Create<LockRoomRequestMapper>());

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            _sut = _mocker.Create<ConsultationsController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task should_return_no_content_when_lock_state_changed()
        {
            // Arrange
            var request = new LockConsultationRoomRequest
            {
                ConferenceId = _testConference.Id,
                RoomLabel = "Room",
                Lock = false
            };

            // Act
            var result = await _sut.LockConsultationRoomRequestAsync(request);

            // Assert
            result.Should().BeOfType<NoContentResult>();
            _mocker.Mock<IVideoApiClient>().Verify(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>()), Times.Once);
        }

        [Test]
        public async Task should_return_badrequest_on_exception()
        {
            // Arrange
            var request = new LockConsultationRoomRequest
            {
                ConferenceId = _testConference.Id,
                RoomLabel = "Room",
                Lock = false
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
               "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>()))
                .ThrowsAsync(apiException);

            // Act
            var result = await _sut.LockConsultationRoomRequestAsync(request);

            // Assert
            result.Should().BeOfType<ObjectResult>();
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>()), Times.Once);            
        }
    }
}
