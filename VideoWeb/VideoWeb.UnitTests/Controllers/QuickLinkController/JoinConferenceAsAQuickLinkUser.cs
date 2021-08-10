using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Controllers.QuickLinkController
{
    public class JoinConferenceAsAQuickLinkUser
    {
        private QuickLinksController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();

            _controller = _mocker.Create<QuickLinksController>();
        }
        
        [Test]
        public async Task Should_update_conference_cache_and_return_a_token()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var conferenceId = Guid.NewGuid();
            var name = "First Last";
            var role = Role.QuickLinkParticipant;
            var userRole = UserRole.QuickLinkParticipant;
            var jwt = "JWT";
            var conference = new Conference();
            var participant = new Participant();
            var participantDetails = new ParticipantDetailsResponse();
            
            _mocker.Mock<IVideoApiClient>().Setup(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole))).ReturnsAsync(new AddQuickLinkParticipantResponse
            {
                ParticipantDetails = participantDetails,
                Token = jwt,
                ConferenceId = conferenceId
            });

            _mocker.Mock<IConferenceCache>().Setup(x =>
                x.GetOrAddConferenceAsync(It.IsAny<Guid>(), It.IsAny<Func<Task<ConferenceDetailsResponse>>>())).ReturnsAsync(conference);

            _mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>()
                .Setup(x => x.Map(It.Is<ParticipantDetailsResponse>(x => x == participantDetails)))
                .Returns(participant);
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, Participant>()).Returns(_mocker.Mock<IMapTo<ParticipantDetailsResponse, Participant>>().Object);
            
            // Act
            var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().BeAssignableTo<QuickLinkParticipantJoinResponse>().Which;
            objectResult.Jwt.Should().Be(jwt);      
            
            _mocker.Mock<IConferenceCache>().Verify(x =>
                x.GetOrAddConferenceAsync(It.Is<Guid>(y => y == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()));
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
        }
        
        [Test]
        public async Task Should_return_a_status_code_when_a_video_api_exception_is_thrown()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var name = "First Last";
            var role = Role.QuickLinkParticipant;
            var userRole = UserRole.QuickLinkParticipant;
            var statusCode = 500;
            var response = "response";

            _mocker.Mock<IVideoApiClient>()
                .Setup(
                    x => x.AddQuickLinkParticipantAsync(It.IsAny<Guid>(), It.IsAny<AddQuickLinkParticipantRequest>()))
                .ThrowsAsync(new VideoApiException("Error", statusCode, response, null, null));
            
            // Act
            var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
            objectResult.StatusCode.Should().Be(statusCode);
            objectResult.Value.Should().BeAssignableTo<string>().Which.Should().Be(response);
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
        }
        
        [TestCase(Role.Individual)]
        [TestCase(Role.Judge)]
        [TestCase(Role.None)]
        [TestCase(Role.Representative)]
        [TestCase(Role.CaseAdmin)]
        [TestCase(Role.HearingFacilitationSupport)]
        [TestCase(Role.JudicialOfficeHolder)]
        [TestCase(Role.VideoHearingsOfficer)]
        public async Task Should_return_a_bad_request_code_when_invalid_role(Role role)
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var name = "First Last";
            var statusCode = StatusCodes.Status400BadRequest;

            // Act
            var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
            objectResult.StatusCode.Should().Be(statusCode);
            objectResult.Value.Should().BeAssignableTo<string>().Which.Should().NotBeEmpty();
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.IsAny<Guid>(),
                It.IsAny<AddQuickLinkParticipantRequest>()), Times.Never);
        }
    }
}
