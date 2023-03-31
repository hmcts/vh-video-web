using System;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using ConferenceForHostResponse = VideoApi.Contract.Responses.ConferenceForHostResponse;
using ConferenceForIndividualResponse = VideoApi.Contract.Responses.ConferenceForIndividualResponse;

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
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForHostResponse, Contract.Responses.ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForIndividualResponse, Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
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

            _mocker.Mock<IConferenceCache>().Setup(x => x.AddConferenceAsync(It.IsAny<ConferenceDetailsResponse>()));
        }


        [Test]
        public async Task Should_return_ok_when_user_is_in_conference()
        {
            var conference = ConferenceDetailsResponseBuilder.CreateValidConferenceResponse();
            conference.Participants[0].UserRole = UserRole.Individual;
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _controller.GetConferenceByIdAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var judge = conference.Participants.SingleOrDefault(p => p.UserRole == UserRole.Judge);
            var staffMember = conference.Participants.SingleOrDefault(p => p.UserRole == UserRole.StaffMember);
            _mocker.Mock<IConferenceCache>().Verify(x => x.AddConferenceAsync(new ConferenceDetailsResponse()), Times.Never);
            var response = (ConferenceResponse)typedResult.Value;
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.Participants[0].Role.Should().Be(UserRole.Individual);
            response.Participants.Any(x => x.Role == Role.Individual).Should().BeTrue();
            response.Participants.Any(x => x.Role == Role.StaffMember).Should().BeTrue();
            response.Participants.Any(x => x.Role == Role.Representative).Should().BeTrue();
            response.Participants.Any(x => x.Role == Role.Judge).Should().BeTrue();
            response.Participants.Any(x => x.Role == Role.StaffMember).Should().BeTrue();
            response.Participants.SingleOrDefault(x => x.Role == Role.Judge).TiledDisplayName.Should().Be($"T{0};{judge.DisplayName};{judge.Id}");
            response.Participants.Any(x => x.Role == Role.JudicialOfficeHolder).Should().BeTrue();
        }

        [Test]
        public async Task Should_return_unauthorised_when_getting_conference_user_does_not_belong_to()
        {
            var conference = ConferenceDetailsResponseBuilder.CreateValidConferenceResponse(null);
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
            var conference = ConferenceDetailsResponseBuilder.CreateValidConferenceResponse(null);
            conference.CurrentStatus = ConferenceState.Closed;
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

            Assert.AreEqual(response.StatusCode, (int)HttpStatusCode.NoContent);
        }
    }
}
