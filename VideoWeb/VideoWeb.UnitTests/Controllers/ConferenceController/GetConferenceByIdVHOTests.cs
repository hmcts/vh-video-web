using System;
using System.Collections.Generic;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using NUnit.Framework.Legacy;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

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
    
            var cache = _mocker.Mock<IConferenceCache>();
            _mocker.Mock<IConferenceService>().Setup(x => x.ConferenceCache).Returns(cache.Object);
        }

        [Test]
        public async Task Should_return_ok_when_user_is_an_admin()
        {
            var conference = CreateValidConferenceResponse(null);
            conference.Participants[0].UserRole = UserRole.Individual;
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);

            var result = await _sut.GetConferenceByIdVhoAsync(conference.Id);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IConferenceService>().Verify(x => x.GetConference(It.IsAny<Guid>()), Times.Never);
            var response = (ConferenceResponseVho)typedResult.Value;
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.Participants[0].Role.Should().Be((Role)UserRole.Individual);
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(apiException);

            var result = await _sut.GetConferenceByIdVhoAsync(Guid.Empty);

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

            var result = await _sut.GetConferenceByIdVhoAsync(Guid.NewGuid());

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

            var result = await _sut.GetConferenceByIdVhoAsync(Guid.NewGuid());
            var typedResult = result.Value;
            typedResult.Should().BeNull();
        }

        [Test]
        public async Task Should_return_NoContent_status_code_when_conference_object_is_not_returned_by_VHO_id()
        {
            var conferenceId = Guid.NewGuid();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(() => default);

            var response = (await _sut.GetConferenceByIdVhoAsync(conferenceId)).Result as NoContentResult;

            ClassicAssert.AreEqual(response.StatusCode, (int)HttpStatusCode.NoContent);
        }

        private ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var judge = new ParticipantResponseBuilder(UserRole.Judge).Build();
            var individualDefendant = new ParticipantResponseBuilder(UserRole.Individual).Build();
            var individualClaimant = new ParticipantResponseBuilder(UserRole.Individual).Build();
            var repClaimant = new ParticipantResponseBuilder(UserRole.Representative).Build();
            var panelMember =
                new ParticipantResponseBuilder(UserRole.JudicialOfficeHolder).Build();
            var participants = new List<ParticipantResponse>()
            {
                individualDefendant, individualClaimant, repClaimant, judge, panelMember
            };
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants[0].Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .With(x => x.IsWaitingRoomOpen = true)
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
                .AddTypedParameters<ParticipantDtoForResponseMapper>()
                .AddTypedParameters<VideoEndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantResponseForUserMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForHostResponse, Contract.Responses.ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));

            var controller = _mocker.Create<ConferencesController>();
            controller.ControllerContext = context;
            return controller;
        }

    }
}
