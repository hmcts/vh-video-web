using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController;

public class GetUnreadMessagesForParticipantsTests : InstantMessageControllerTestBase
{
    [Test]
    public async Task Should_return_exception()
    {
        var conference = InitConference();
        
        var conferenceId = conference.Id;
        var participantUsername = conference.Participants[0].Id;
        var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
            (int)HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername.ToString()))
            .ThrowsAsync(apiException);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conferenceId), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetUnreadMessagesForParticipantAsync(conferenceId, participantUsername, CancellationToken.None);
        var typedResult = (ObjectResult)result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_return_okay_code_and_zero_unread_messages_when_there_is_no_im_history()
    {
        var conference = InitConference();
        
        var conferenceId = conference.Id;
        var participantUsername = conference.Participants[0].Id;
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername.ToString()))
            .ReturnsAsync(new List<InstantMessageResponse>());
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var result = await Sut.GetUnreadMessagesForParticipantAsync(conferenceId, Guid.Parse(participantUsername.ToString()), CancellationToken.None);
        
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
        responseModel.NumberOfUnreadMessages.Should().Be(0);
    }
    
    [Test]
    public async Task should_return_okay_code_and_number_of_unread_messages_since_vho_responded_last_for_judge()
    {
        var conference = InitConference();
        var messages = InitMessages(conference);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var judgeParticipant = conference.Participants.Single(x => x.Role == Role.Judge);
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conference.Id, judgeParticipant.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(messages);
        
        // check judge messages
        var result = await Sut.GetUnreadMessagesForParticipantAsync(conference.Id, judgeParticipant.Id, CancellationToken.None);
        
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
        responseModel.NumberOfUnreadMessages.Should().BeGreaterThan(0);
        responseModel.NumberOfUnreadMessages.Should().Be(2);
    }
    
    [Test]
    public async Task should_return_okay_code_and_number_of_unread_messages_since_vho_responded_last_for_representative()
    {
        var conference = InitConference();
        var messages = InitMessagesRepresentative(conference);
        
        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var representativeParticipant = conference.Participants.First(x => x.Role == Role.Representative);
        Mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conference.Id, representativeParticipant.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(messages);
        
        // check representative messages
        var result = await Sut.GetUnreadMessagesForParticipantAsync(conference.Id, representativeParticipant.Id, CancellationToken.None);
        
        var typedResult = (OkObjectResult)result;
        typedResult.Should().NotBeNull();
        var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
        responseModel.NumberOfUnreadMessages.Should().BeGreaterThan(0);
        responseModel.NumberOfUnreadMessages.Should().Be(3);
    }
    
    private static Conference InitConference()
    {
        var participants = Builder<Participant>.CreateListOfSize(4)
            .All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.Username = Internet.Email())
            .TheFirst(1).With(x => x.Role = Role.Judge)
            .TheNext(1).With(x => x.Role = Role.Representative)
            .TheRest().With(x => x.Role = Role.Individual).Build().ToList();
        
        return Builder<Conference>.CreateNew().With(x => x.Id = Guid.NewGuid())
            .With(x => x.Participants = participants).Build();
    }
    
    private static List<InstantMessageResponse> InitMessages(Conference conference)
    {
        var judge = conference.Participants.Single(x => x.Role == Role.Judge);
        const string vho1Username = "vho1@hmcts.net";
        
        return new List<InstantMessageResponse>
        {
            new InstantMessageResponse
                {From = judge.Username, MessageText = "judge -> vho - 03", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-1)},
            new InstantMessageResponse
                {From = judge.Username, MessageText = "judge -> vho - 02", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-2)},
            new InstantMessageResponse
                {From = vho1Username, MessageText = "vho -> judge - 02", To = judge.Username, TimeStamp = DateTime.UtcNow.AddMinutes(-3)},
            new InstantMessageResponse
                {From = judge.Username, MessageText = "judge -> vho - 01", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-4)},
            new InstantMessageResponse
                {From = vho1Username, MessageText = "vho -> judge - 01", To = judge.Username, TimeStamp = DateTime.UtcNow.AddMinutes(-5)},
        };
    }
    
    private static List<InstantMessageResponse> InitMessagesRepresentative(Conference conference)
    {
        var representative = conference.Participants.Single(x => x.Role == Role.Representative);
        const string vho1Username = "vho1@hmcts.net";
        
        return new List<InstantMessageResponse>
        {
            new InstantMessageResponse
                {From = representative.Username, MessageText = "representative -> vho - 03", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-1)},
            new InstantMessageResponse
                {From = representative.Username, MessageText = "representative -> vho - 02", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-2)},
            new InstantMessageResponse
                {From = representative.Username, MessageText = "representative -> vho - 01", To = vho1Username, TimeStamp = DateTime.UtcNow.AddMinutes(-3)},
            new InstantMessageResponse
                {From = vho1Username, MessageText = "vho -> representative - 01", To = representative.Username, TimeStamp = DateTime.UtcNow.AddMinutes(-4)},
        };
    }
}
