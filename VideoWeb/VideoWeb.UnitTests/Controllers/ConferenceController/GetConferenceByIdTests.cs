using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Legacy;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using EndpointResponse = VideoApi.Contract.Responses.EndpointResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferenceByIdTests
    {
        private AutoMock _mocker;
        private ConferencesController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<VideoEndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForHostResponse, VideoWeb.Contract.Responses.ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, VideoWeb.Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ClaimsPrincipal, UserProfileResponse>())
                .Returns(_mocker.Create<ClaimsPrincipalToUserProfileResponseMapper>());

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.CitizenRole).Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller = _mocker.Create<ConferencesController>();
            _controller.ControllerContext = context;
            var cache = _mocker.Mock<IConferenceCache>();
             _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.IsAny<Guid>()));
            _mocker.Mock<IConferenceService>().Setup(x => x.ConferenceCache).Returns(cache.Object);
        }


        [Test]
        public async Task Should_return_ok_when_user_is_in_conference()
        {
            var conference = CreateValidConferenceResponse();
            var hearing = CreateValidHearingDetailResponse(conference);
            conference.Participants[0].UserRole = UserRole.Individual;
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingDetailsByIdV2Async(conference.HearingId))
                .ReturnsAsync(hearing);
            var result = await _controller.GetConferenceByIdAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var judge = conference.Participants.SingleOrDefault(p => p.UserRole == UserRole.Judge);
            
            _mocker.Mock<IConferenceService>().Verify(x => x.GetConference(It.IsAny<Guid>()), Times.Never);
            var response = (ConferenceResponse)typedResult.Value;
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.Participants[0].Role.Should().Be((Role)UserRole.Individual);
            response.Participants.Exists(x => x.Role == Role.Individual).Should().BeTrue();
            response.Participants.Exists(x => x.Role == Role.StaffMember).Should().BeTrue();
            response.Participants.Exists(x => x.Role == Role.Representative).Should().BeTrue();
            response.Participants.Exists(x => x.Role == Role.Judge).Should().BeTrue();
            response.Participants.Exists(x => x.Role == Role.StaffMember).Should().BeTrue();
            response.Participants.SingleOrDefault(x => x.Role == Role.Judge).TiledDisplayName.Should().Be($"T{0};{judge.DisplayName};{judge.Id}");
            response.Participants.Exists(x => x.Role == Role.JudicialOfficeHolder).Should().BeTrue();
        }

        [Test]
        public async Task Should_return_unauthorised_when_getting_conference_user_does_not_belong_to()
        {
            var conference = CreateValidConferenceResponse(null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceByIdAsync(conference.Id);
            var typedResult = (UnauthorizedResult) result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_unauthorised_when_conference_exceededLimit()
        {
            var conference = CreateValidConferenceResponse(null);
            conference.CurrentStatus = ConferenceState.Closed;
            conference.IsWaitingRoomOpen = false;
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceByIdAsync(conference.Id);
            var typedResult = (UnauthorizedResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdAsync(Guid.Empty);

            var typedResult = (BadRequestObjectResult) result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token",
                (int) HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdAsync(Guid.NewGuid());

            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceByIdAsync(Guid.NewGuid());
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }

        [Test]
        public async Task Should_return_NoContent_status_code_when_conference_details_is_not_returned_by_id()
        {
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(() => default);

            var response = (await _controller.GetConferenceByIdAsync(conferenceId)).Result as NoContentResult;

            ClassicAssert.AreEqual(response.StatusCode, (int)HttpStatusCode.NoContent);
        }

        private static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var judge = new ParticipantDetailsResponseBuilder(UserRole.Judge, "Judge").Build();
            var staffMember = new ParticipantDetailsResponseBuilder(UserRole.StaffMember, "StaffMember").Build();
            var individualDefendant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build();
            var individualClaimant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build();
            var repClaimant = new ParticipantDetailsResponseBuilder(UserRole.Representative, "Claimant").Build();
            var panelMember =
                new ParticipantDetailsResponseBuilder(UserRole.JudicialOfficeHolder, "Panel Member").Build();
            var participants = new List<ParticipantDetailsResponse>()
            {
                individualDefendant, individualClaimant, repClaimant, judge, panelMember, staffMember
            };
            var endpoints = Builder<EndpointResponse>.CreateListOfSize(2).Build().ToList();
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants[0].Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .With(x => x.Endpoints = endpoints)
                .With(x => x.IsWaitingRoomOpen = true)
                .Build();
            return conference;
        }
        private static HearingDetailsResponseV2 CreateValidHearingDetailResponse(ConferenceDetailsResponse conference)
        {            
            var judge = new JudicialParticipantResponseBuilder(true).Build();
            var panelMember = new JudicialParticipantResponseBuilder(false).Build();
            var staffMember = new ParticipantFromBookingApiResponseBuilder(UserRole.StaffMember, "StaffMember").Build();
            var individualDefendant = new ParticipantFromBookingApiResponseBuilder(UserRole.Individual, "Defendant").Build();
            var individualClaimant = new ParticipantFromBookingApiResponseBuilder(UserRole.Individual, "Claimant").Build();
            var repClaimant = new ParticipantFromBookingApiResponseBuilder(UserRole.Representative, "Claimant").Build();
            var participants = new List<ParticipantResponseV2>()
            {
                individualDefendant, individualClaimant, repClaimant, staffMember
            };
            var judiciaryParticipants = new List<JudiciaryParticipantResponse>()
            {
                judge, panelMember
            };
            var hearing = Builder<HearingDetailsResponseV2>.CreateNew()
                .With(x => x.Participants = participants)
                .With(x => x.JudiciaryParticipants = judiciaryParticipants)
                .Build();
            hearing.Id = conference.HearingId;
            
            return hearing;
        }

    }
}
