using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConsultationController;

public class EndConsultationTest
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
        
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConference.Id),It.IsAny<CancellationToken>())).ReturnsAsync(_testConference);
        _sut = _mocker.Create<ConsultationsController>();
        _sut.ControllerContext = context;
    }
    
    
    [Test]
    public async Task Should_return_participant_not_found_when_request_is_sent()
    {
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.LeaveConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
            .Returns(Task.FromResult(default(object)));
        var conference = new Conference { Id = Guid.NewGuid() };

        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(y => y == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        var endConsultationRequest = Builder<LeavePrivateConsultationRequest>.CreateNew()
            .With(x => x.ConferenceId = conference.Id).Build();
        var result = await _sut.LeaveConsultationAsync(endConsultationRequest, CancellationToken.None);
        
        var typedResult = (NotFoundResult)result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_return_no_content_when_request_is_sent()
    {
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.LeaveConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
            .Returns(Task.FromResult(default(object)));
        
        var leaveConsultationRequest = ConsultationHelper.GetLeaveConsultationRequest(_testConference);
        var result = await _sut.LeaveConsultationAsync(leaveConsultationRequest, CancellationToken.None);
        
        result.Should().BeOfType<NoContentResult>();
    }
    
    
    [Test]
    public async Task Should_return_bad_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
            "Please provide a valid conference Id", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.LeaveConsultationAsync(It.IsAny<LeaveConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result =
            await _sut.LeaveConsultationAsync(
                ConsultationHelper.GetLeaveConsultationRequest(_testConference), CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
    }
    
    [Test]
    public async Task Should_return_exception()
    {
        var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
            (int)HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.LeaveConsultationAsync(It.IsAny<LeaveConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result =
            await _sut.LeaveConsultationAsync(
                ConsultationHelper.GetLeaveConsultationRequest(_testConference), CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
    }
}
