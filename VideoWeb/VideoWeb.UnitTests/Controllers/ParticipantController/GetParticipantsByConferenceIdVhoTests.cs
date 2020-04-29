using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ParticipantResponse = VideoWeb.Services.Bookings.ParticipantResponse;
using ProblemDetails = VideoWeb.Services.User.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetParticipantsByConferenceIdVhoTests
    {
        private EventComponentHelper _eventComponentHelper;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<ParticipantsController>> _mockLogger;
        private Mock<IConferenceCache> _mockConferenceCache;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        
        private ParticipantsController _controller;

        [SetUp]
        public void Setup()
        {
            _eventComponentHelper = new EventComponentHelper();
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _mockLogger = new Mock<ILogger<ParticipantsController>>(MockBehavior.Loose);
            _mockConferenceCache = new Mock<IConferenceCache>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }
        
        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            var judge3DifferentHearing = CreateParticipant("judge3");
            conference.Participants = new List<Participant>
            {
                judge1, judge2, judge3
            };
            
            var bookingParticipants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id = judge1.RefId, First_name = "judge1", Last_name = "judge1", Contact_email = "judge1", Telephone_number = "judge1"},
                new ParticipantResponse{Id = judge2.RefId, First_name = "judge2", Last_name = "judge2", Contact_email = "judge2", Telephone_number = "judge2"},
                new ParticipantResponse{Id = judge3.RefId, First_name = "judge3", Last_name = "judge3", Contact_email = "judge3", Telephone_number = "judge3"}
            };
            
            var judgesInHearings = new List<JudgeInHearingResponse>
            {
                new JudgeInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);
            _bookingsApiClientMock.Setup(x => x.GetAllParticipantsInHearingAsync(conference.HearingId))
                .ReturnsAsync(bookingParticipants);
            _videoApiClientMock
                .Setup(x => x.GetJudgesInHearingsTodayAsync())
                .ReturnsAsync(judgesInHearings);

            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(conference.Id);
            var typedResult = result as OkObjectResult;
            typedResult.Should().NotBeNull();
            typedResult.Value.Should().NotBeNull();
            typedResult.Value.Should().BeAssignableTo<IEnumerable<ParticipantContactDetailsResponseVho>>();
            var results = ((IEnumerable<ParticipantContactDetailsResponseVho>)typedResult.Value).ToList();
            results.Should().NotBeNullOrEmpty();
            results.Count.Should().Be(3);

            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, bookingParticipants[0], false);
            AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, bookingParticipants[1], false);
            AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, bookingParticipants[2], true);
        }

        [Test]
        public async Task Should_return_bad_request_when_conferenceId_empty()
        {
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(Guid.Empty);
            
            var typedResult = (BadRequestObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_return_unauthorised_when_user_not_in_vho_role()
        {
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.Individual).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(Guid.NewGuid());
            
            var typedResult = (UnauthorizedObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }
        
        [Test]
        public async Task Should_throw_error_when_get_video_api_throws_error()
        {
            var conferenceId = Guid.NewGuid();
            
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id and participant Id", null, default, null);
            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ThrowsAsync(apiException);
        
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
        
        [Test]
        public async Task Should_throw_error_when_get_booking_api_throws_error()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            conference.Participants = new List<Participant>
            {
                judge1, judge2, judge3
            };

            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);
            
            var apiException = new BookingsApiException("Hearing does not exist", (int)HttpStatusCode.NotFound,
                "Invalid Hearing Id", null, null);
            _mockConferenceCache.Setup(x => x.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .ReturnsAsync(conference);
            _bookingsApiClientMock.Setup(x => x.GetAllParticipantsInHearingAsync(conference.HearingId))
                .ThrowsAsync(apiException);
        
            var result = await _controller.GetParticipantsWithContactDetailsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
        }

        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, Participant participant, 
            Guid conferenceId, ParticipantResponse bookingParticipant, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participant.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participant.Name);
            response.Role.Should().Be(participant.Role);
            response.Username.Should().Be(participant.Username);
            response.CaseTypeGroup.Should().Be(participant.CaseTypeGroup);
            response.RefId.Should().Be(participant.RefId);
            response.FirstName.Should().Be(bookingParticipant.First_name);
            response.LastName.Should().Be(bookingParticipant.Last_name);
            response.DisplayName.Should().Be(participant.DisplayName);
            response.Status.Should().Be(participant.ParticipantStatus);
            response.ContactEmail.Should().Be(bookingParticipant.Contact_email);
            response.ContactTelephone.Should().Be(bookingParticipant.Telephone_number);
            response.HearingVenueName.Should().Be("MyVenue");
            response.JudgeInAnotherHearing.Should().Be(isInAnotherHearing);
        }
        
        private static Participant CreateParticipant(string username)
        {
            return Builder<Participant>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Name = username)
                .With(x => x.Role = Role.Judge)
                .With(x => x.Username = username)
                .With(x => x.CaseTypeGroup == ParticipantStatus.Available.ToString())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x => x.DisplayName = $"{username} {username}")
                .Build();
        }

        private static Conference CreateValidConference(Guid conferenceId)
        {
            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.HearingId = Guid.NewGuid())
                .With(x => x.HearingVenueName = "MyVenue")
                .Build();
            
            return conference;
        }
        
        private ParticipantsController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var eventHandlerFactory = new EventHandlerFactory(_eventComponentHelper.GetHandlers());
            return new ParticipantsController(_videoApiClientMock.Object, eventHandlerFactory, _mockConferenceCache.Object, 
                _mockLogger.Object, _bookingsApiClientMock.Object)
            {
                ControllerContext = context
            };
        }
    }
}
