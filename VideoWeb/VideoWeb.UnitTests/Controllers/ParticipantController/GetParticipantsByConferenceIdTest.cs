using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoWeb.Common;
using ParticipantResponse = VideoWeb.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class GetParticipantsByConferenceIdTest
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _sut = _mocker.Create<ParticipantsController>();
    }
    
    [Test]
    public async Task Should_return_ok()
    {
        var conferenceId = Guid.NewGuid();
        var response = CreateValidParticipantConferenceDto();
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);
        
        var result = await _sut.GetParticipantsByConferenceIdAsync(conferenceId, CancellationToken.None);
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var participants = (List<ParticipantResponse>)typedResult.Value;
        participants.Should().NotBeNull();
        participants.Count.Should().Be(3);
    }
    
    [Test]
    public async Task Should_throw_exception()
    {
        var conferenceId = Guid.NewGuid();
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
            "Please provide a valid conference Id", null, default, null);
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.ForceGetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Throws(apiException);
        
        var result = await _sut.GetParticipantsByConferenceIdAsync(conferenceId, CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        
    }
    
    private Conference CreateValidParticipantConferenceDto()
    {
        var participants = Builder<Participant>
            .CreateListOfSize(3).All()
            .With(x => x.LinkedParticipants = new List<LinkedParticipant>()).Build().ToList();
        
        var conference = Builder<Conference>
            .CreateNew()
            .With(x => x.Participants = participants);
        
        return conference.Build();
    }
}
