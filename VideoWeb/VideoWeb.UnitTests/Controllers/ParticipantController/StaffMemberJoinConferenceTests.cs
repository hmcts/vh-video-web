using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoWeb.Contract.Request;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class StaffMemberJoinConferenceTests
    {
        private AutoMock _mocker;
        private ParticipantsController _sut;
        private ConferenceDetailsResponse _testConference;
        private const string Username = "staff_member@hmcts.net";

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ClaimsPrincipal, UserProfileResponse>())
                .Returns(_mocker.Create<ClaimsPrincipalToUserProfileResponseMapper>());

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ConferenceResponseMapper>()
                .AddTypedParameters<ParticipantResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.StaffMember).Build();
            _testConference = CreateValidConferenceResponse();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            _sut = _mocker.Create<ParticipantsController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = _testConference.Id;
            var addStaffMemberRequest = new AddStaffMemberRequest()
            {
                FirstName = "FirstName",
                LastName = "LastName",
                Username = "Staff_UserName",
                HearingRole = HearingRoleName.StaffMember,
                Name = "FullName",
                DisplayName = "DisplayName",
                UserRole = UserRole.StaffMember,
                ContactEmail = "FirstName_LastName@hmcts.net"
            };
            _mocker.Mock<IParticipantService>().Setup(x => x.CanStaffMemberJoinConference(_testConference))
                .Returns(true);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_testConference);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.AddStaffMemberToConferenceAsync(It.IsAny<Guid>(), addStaffMemberRequest))
                .Returns(Task.FromResult(default(AddStaffMemberResponse)));

            var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_throw_error_when_add_staff_member_throws_error()
        {
            var conferenceId = _testConference.Id;
            var errorResponse = $"Unable to add staff member for conference: {conferenceId}";
            var videoApiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                errorResponse, null, default, null);
            _mocker.Mock<IParticipantService>().Setup(x => x.CanStaffMemberJoinConference(_testConference))
                .Returns(true);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_testConference);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.AddStaffMemberToConferenceAsync(It.IsAny<Guid>(), It.IsAny<AddStaffMemberRequest>()))
                .ThrowsAsync(videoApiException);

            var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            typedResult.Value.Should().Be(errorResponse);
        }

        [Test]
        public async Task Should_throw_error_when_get_conference_details_throws_error()
        {
            var conferenceId = _testConference.Id;
            var errorResponse = $"Unable to get conferenceDetails conference: {conferenceId}";
            var videoApiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                errorResponse, null, default, null);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(videoApiException);
            var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
            typedResult.Value.Should().Be(errorResponse);
        }

        [Test]
        public async Task Should_throw_error_when_CanStaffMemberJoinConference_return_false()
        {
            var conferenceId = _testConference.Id;

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_testConference);
            _mocker.Mock<IParticipantService>().Setup(x => x.CanStaffMemberJoinConference(_testConference))
                .Returns(false);

            var result = await _sut.StaffMemberJoinConferenceAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        private static ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var judge = new ParticipantDetailsResponseBuilder(UserRole.Judge, "Judge").Build();
            var staffMember = new ParticipantDetailsResponseBuilder(UserRole.StaffMember, "StaffMember").Build();

            var individualDefendant = new ParticipantDetailsResponseBuilder(UserRole.Individual, "Defendant").Build();
            var panelMember =
                new ParticipantDetailsResponseBuilder(UserRole.JudicialOfficeHolder, "Panel Member").Build();
            var participants = new List<ParticipantDetailsResponse>()
            {
                individualDefendant, judge, panelMember, staffMember
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
    }
}
