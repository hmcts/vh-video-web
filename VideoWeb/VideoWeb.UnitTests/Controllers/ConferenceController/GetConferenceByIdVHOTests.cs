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
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferenceByIdVhoTests
    {
        private ConferencesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<ConferencesController>> _mockLogger;
        private Mock<IConferenceCache> _mockConferenceCache;

        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _mockLogger = new Mock<ILogger<ConferencesController>>(MockBehavior.Loose);
            _mockConferenceCache = new Mock<IConferenceCache>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.VideoHearingsOfficer).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
           
            _mockConferenceCache.Setup(x => x.AddConferenceToCache(It.IsAny<ConferenceDetailsResponse>()));
        }

        [Test]
        public async Task Should_not_return_error_when_unable_to_retrieve_booking_participants()
        {
            var apiException = new BookingsApiException("Hearing does not exist", (int)HttpStatusCode.NotFound,
                "Invalid Hearing Id", null, null);
            _bookingsApiClientMock
                .Setup(x => x.GetAllParticipantsInHearingAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var conference = CreateValidConferenceResponse();
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceByIdVHOAsync(conference.Id);
            var typedResult = result.Value;
            typedResult.Should().BeNull();
            var objectResult = (ObjectResult)result.Result;
            objectResult.StatusCode.Should().Be((int)HttpStatusCode.OK);
        }


        [Test]
        public async Task Should_return_ok_when_user_belongs_to_conference()
        {
            var conference = CreateValidConferenceResponse();
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var bookingParticipants = CreateBookingParticipantResponses(conference.Participants);
            _bookingsApiClientMock
                .Setup(x => x.GetAllParticipantsInHearingAsync(It.IsAny<Guid>()))
                .ReturnsAsync(bookingParticipants);

            var result = await _controller.GetConferenceByIdVHOAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_error_when_booking_participants_are_missing()
        {
            var conference = CreateValidConferenceResponse();
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var bookingParticipants = CreateBookingParticipantResponses(conference.Participants);
            bookingParticipants[0].Id = Guid.NewGuid();
            _bookingsApiClientMock
                .Setup(x => x.GetAllParticipantsInHearingAsync(It.IsAny<Guid>()))
                .ReturnsAsync(bookingParticipants);

            var result = await _controller.GetConferenceByIdVHOAsync(conference.Id);

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.ExpectationFailed);
            ((AggregateException)typedResult.Value).Message.Should()
                .Contain("Unable to find a participant in bookings api with id ");
        }

        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conference = CreateValidConferenceResponse(null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var bookingParticipants = CreateBookingParticipantResponses(conference.Participants);
            _bookingsApiClientMock
                .Setup(x => x.GetAllParticipantsInHearingAsync(It.IsAny<Guid>()))
                .ReturnsAsync(bookingParticipants);

            var result = await _controller.GetConferenceByIdVHOAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            _mockConferenceCache.Verify(x => x.AddConferenceToCache(new ConferenceDetailsResponse()), Times.Never);
        }

        [Test]
        public async Task Should_return_unauthorized_when_user_is_not_admin()
        {
            var conference = CreateValidConferenceResponse(null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.Individual).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
            var result = await _controller.GetConferenceByIdVHOAsync(conference.Id);
            var typedResult = (UnauthorizedObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdVHOAsync(Guid.Empty);

            var typedResult = (BadRequestObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token",
                (int)HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdVHOAsync(Guid.NewGuid());

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdVHOAsync(Guid.NewGuid());
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }

        private ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@doe.com")
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants.First().Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }

        private List<BookingParticipant> CreateBookingParticipantResponses(
            List<ParticipantDetailsResponse> participantDetails)
        {
            var bookingParticipants = new List<BookingParticipant>();
            foreach (var participantDetail in participantDetails)
            {
                var bp = Builder<BookingParticipant>.CreateNew().With(x => x.Id = participantDetail.Ref_id).Build();
                bookingParticipants.Add(bp);
            }

            return bookingParticipants;
        }
        
        private ConferencesController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            return new ConferencesController(_videoApiClientMock.Object, _bookingsApiClientMock.Object,
                _mockLogger.Object, _mockConferenceCache.Object)
            {
                ControllerContext = context
            };
        }

    }
}
