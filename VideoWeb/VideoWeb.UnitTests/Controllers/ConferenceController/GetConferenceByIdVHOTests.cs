using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferenceByIdVhoTests
    {
        private AutoMock _mocker;
        private ConferencesController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            _sut = SetupControllerWithClaims(claimsPrincipal);
        }

        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conference = CreateValidConferenceResponse(null);
            conference.Participants[0].UserRole = UserRole.Individual;
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _sut.GetConferenceByIdVHOAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IConferenceCache>().Verify(x => x.AddConferenceAsync(new ConferenceDetailsResponse()), Times.Never);
            var response = (ConferenceResponseVho)typedResult.Value;
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.Participants[0].Role.Should().Be(UserRole.Individual);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferenceByIdVHOAsync(Guid.Empty);

            var typedResult = (BadRequestObjectResult)result.Result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_forbidden_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token",
                (int)HttpStatusCode.Unauthorized,
                "Invalid Client ID", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferenceByIdVHOAsync(Guid.NewGuid());

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferenceByIdVHOAsync(Guid.NewGuid());
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }

        private ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var judge = new ParticipantDetailsResponseBuilder(UserRole.Judge, "Judge").Build();
            var individualDefendant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build();
            var individualClaimant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Claimant").Build();
            var repClaimant = new ParticipantDetailsResponseBuilder(UserRole.Representative, "Claimant").Build();
            var panelMember =
                new ParticipantDetailsResponseBuilder(UserRole.JudicialOfficeHolder, "Panel Member").Build();
            var participants = new List<ParticipantDetailsResponse>()
            {
                individualDefendant, individualClaimant, repClaimant, judge, panelMember
            };
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants.First().Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
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

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForJudgeResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForJudgeResponse, VideoWeb.Contract.Responses.ConferenceForJudgeResponse>()).Returns(_mocker.Create<ConferenceForJudgeResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, VideoWeb.Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));

            var controller = _mocker.Create<ConferencesController>();
            controller.ControllerContext = context;
            return controller;
        }

    }
}
