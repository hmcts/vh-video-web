using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public class GetUnreadMessagesForParticipantsTests : InstantMessageControllerTestBase
    {
        [Test]
        public async Task Should_return_exception()
        {
            var conferenceId = Guid.NewGuid();
            var participantUsername = "individual participant";
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ThrowsAsync(apiException);

            var result = await Controller.GetUnreadMessagesForParticipantAsync(conferenceId, participantUsername);
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_okay_code_and_zero_unread_messages_when_there_is_no_im_history()
        {
            var conferenceId = Guid.NewGuid();
            var participantUsername = "individual participant";
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(new List<InstantMessageResponse>());

            var result = await Controller.GetUnreadMessagesForParticipantAsync(conferenceId, participantUsername);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
            responseModel.NumberOfUnreadMessages.Should().Be(0);
        }

        [Test]
        public async Task should_return_okay_code_and_number_of_unread_messages_since_vho_responded_last_to_judge()
        {
            var conference = InitConference();
            var messages = InitMessages(conference);
            ConferenceCache
                .Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                .ReturnsAsync(messages);

            // check judge messages
            var judgeParticipant = conference.Participants.Single(x => x.Role == Role.Judge);
            var result = await Controller.GetUnreadMessagesForParticipantAsync(conference.Id, judgeParticipant.Username);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
            responseModel.NumberOfUnreadMessages.Should().BeGreaterThan(0);
        }

        [Test]
        public async Task should_return_okay_code_and_number_of_unread_messages_since_vho_responded_last_to_representative()
        {
            var conference = InitConference();
            var messages = InitMessages(conference);
            ConferenceCache
                .Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                .ReturnsAsync(messages);

            // check individual messages
            var representativeParticipant = conference.Participants.First(x => x.Role == Role.Representative);
            var result = await Controller.GetUnreadMessagesForParticipantAsync(conference.Id, representativeParticipant.Username);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = (UnreadAdminMessageResponse)typedResult.Value;
            responseModel.NumberOfUnreadMessages.Should().BeGreaterThan(0);
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
            var individual = conference.Participants.First(x => x.Role == Role.Individual);
            var representative = conference.Participants.Single(x => x.Role == Role.Representative);
            const string vho1Username = "vho1@hmcts.net";

            return new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "message 01 to individual", To = individual.Username, Time_stamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "message 01 to representative", To = representative.Username, Time_stamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "message 01 to judge", To = judge.Username, Time_stamp = DateTime.UtcNow.AddMinutes(-3)},
                new InstantMessageResponse
                    {From = individual.Username, Message_text = "individual reply to vho1", To = vho1Username, Time_stamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = representative.Username, Message_text = "rep reply to vho1", To = vho1Username, Time_stamp = DateTime.UtcNow.AddMinutes(-5)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge reply to vho1", To = vho1Username, Time_stamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "are we ready to start the hearing", To = vho1Username, Time_stamp = DateTime.UtcNow.AddMinutes(-7)},
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "yes all participants present to start", To = judge.Username, Time_stamp = DateTime.UtcNow.AddMinutes(-8)},
            };
        }
    }
}
