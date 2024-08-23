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
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController;

public class GetConferenceInstantMessageHistoryTests : InstantMessageControllerTestBase
{
    [Test]
    public async Task Should_return_okay_code_when_chat_history_is_found()
    {
        var conference = InitConference();
        
        var conferenceId = conference.Id;
        var participantUsername = conference.Participants[0].Id.ToString();
        var messages = Builder<InstantMessageResponse>.CreateListOfSize(5).Build().ToList();
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(messages);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, Guid.Parse(participantUsername), CancellationToken.None);
        
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = typedResult.Value as List<ChatResponse>;
        responseModel.Should().NotBeNullOrEmpty();
        responseModel?.Count.Should().Be(messages.Count);
        responseModel?.Should().BeInAscendingOrder(r => r.Timestamp);
    }
    
    [Test]
    public async Task Should_return_okay_code_when_chat_history_is_empty()
    {
        var conference = InitConference();
        
        var conferenceId = conference.Id;
        var participantUsername = conference.Participants[0].Id.ToString();
        var messages = new List<InstantMessageResponse>();
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username))
            .ReturnsAsync(messages);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, Guid.Parse(participantUsername), CancellationToken.None);
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = typedResult.Value as List<ChatResponse>;
        responseModel.Should().BeEmpty();
    }
    
    [Test]
    public async Task Should_map_originators_when_message_is_not_from_user()
    {
        var conference = InitConference();
        var conferenceId = conference.Id;
        var messages = Builder<InstantMessageResponse>.CreateListOfSize(5)
            .TheFirst(2)
            .With(x => x.From = "john@hmcts.net").TheNext(3)
            .With(x => x.From = "someOther@hmcts.net")
            .Build().ToList();
        
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(messages);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Id, CancellationToken.None);
        
        Mocker.Mock<IMessageDecoder>().Verify(x => x.IsMessageFromUser(
                It.Is<InstantMessageResponse>(m => m.From == conference.Participants[0].Username), conference.Participants[0].Username),
            Times.Exactly(2));
        
        Mocker.Mock<IMessageDecoder>().Verify(x => x.IsMessageFromUser(
                It.Is<InstantMessageResponse>(m => m.From == "someOther@hmcts.net"), conference.Participants[0].Username),
            Times.Exactly(3));
        
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = typedResult.Value as List<ChatResponse>;
        responseModel?.Count(x => x.FromDisplayName == "You").Should().Be(2);
        
    }
    
    [Test]
    public async Task Should_return_exception()
    {
        var conference = InitConference();
        
        var conferenceId = conference.Id;
        var participantUsername = conference.Participants[0].Username;
        var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
            (int)HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername))
            .ThrowsAsync(apiException);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Id, CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.Should().NotBeNull();
    }
    
    private static Conference InitConference()
    {
        var participants = Builder<Participant>.CreateListOfSize(5)
            .All()
            .With(x => x.Id = Guid.NewGuid())
            .TheFirst(1)
            .With(x => x.Username = "john@hmcts.net")
            .TheLast(1)
            .With(x => x.Username = "someOther@hmcts.net")
            .TheFirst(1).With(x => x.Role = Role.Judge)
            .TheRest().With(x => x.Role = Role.Individual).Build().ToList();
        
        
        
        return Builder<Conference>.CreateNew().With(x => x.Id = Guid.NewGuid())
            .With(x => x.Participants = participants).Build();
    }
}
