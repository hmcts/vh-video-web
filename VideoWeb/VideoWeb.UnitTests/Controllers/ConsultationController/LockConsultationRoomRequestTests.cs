using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConsultationController;

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
        
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConference.Id), It.IsAny<CancellationToken>())).ReturnsAsync(_testConference);
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
        var result = await _sut.LockConsultationRoomRequestAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<NoContentResult>();
        _mocker.Mock<IVideoApiClient>().Verify(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>(), It.IsAny<CancellationToken>()), Times.Once);
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
            .Setup(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        // Act
        var result = await _sut.LockConsultationRoomRequestAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<ObjectResult>();
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        _mocker.Mock<IVideoApiClient>().Verify(x => x.LockRoomAsync(It.IsAny<LockRoomRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
