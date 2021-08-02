using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text.Unicode;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Faker;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
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

namespace VideoWeb.UnitTests.Controllers.MagicLinkController
{
    public class JoinConferenceAsAMagicLinkUser
    {
        private MagicLinksController _controller;
        private AutoMock _mocker;

        [SetUp]
        public void SetUp()
        {
            _mocker = AutoMock.GetLoose();

            _controller = _mocker.Create<MagicLinksController>();
        }
        
        [Test]
        public async Task Should_update_conference_cache_and_return_a_token()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var conferenceId = Guid.NewGuid();
            var name = "First Last";
            var role = Role.MagicLinkParticipant;
            var userRole = UserRole.MagicLinkParticipant;
            var jwt = "JWT";
            var conference = new Conference();
            var participant = new Participant();
            var participantDetails = new ParticipantDetailsResponse();
            
            _mocker.Mock<IVideoApiClient>().Setup(x => x.AddMagicLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddMagicLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole))).ReturnsAsync(new AddMagicLinkParticipantResponse
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
            var result = await _controller.Join(hearingId, new MagicLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().BeAssignableTo<MagicLinkParticipantJoinResponse>().Which;
            objectResult.Jwt.Should().Be(jwt);      
            
            _mocker.Mock<IConferenceCache>().Verify(x =>
                x.GetOrAddConferenceAsync(It.Is<Guid>(y => y == conferenceId), It.IsAny<Func<Task<ConferenceDetailsResponse>>>()));
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.Is<Conference>(y => y == conference)), Times.Once());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddMagicLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddMagicLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
        }
        
        [Test]
        public async Task Should_return_a_status_code_when_a_video_api_exception_is_thrown()
        {
            // Arrange
            var hearingId = Guid.NewGuid();
            var name = "First Last";
            var role = Role.MagicLinkParticipant;
            var userRole = UserRole.MagicLinkParticipant;
            var statusCode = 500;
            var response = "response";

            _mocker.Mock<IVideoApiClient>()
                .Setup(
                    x => x.AddMagicLinkParticipantAsync(It.IsAny<Guid>(), It.IsAny<AddMagicLinkParticipantRequest>()))
                .ThrowsAsync(new VideoApiException("Error", statusCode, response, null, null));
            
            // Act
            var result = await _controller.Join(hearingId, new MagicLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
            objectResult.StatusCode.Should().Be(statusCode);
            objectResult.Value.Should().BeAssignableTo<string>().Which.Should().Be(response);
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddMagicLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
                It.Is<AddMagicLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
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
            var result = await _controller.Join(hearingId, new MagicLinkParticipantJoinRequest
            {
                Name = name,
                Role = role
            });

            // Assert
            var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
            objectResult.StatusCode.Should().Be(statusCode);
            objectResult.Value.Should().BeAssignableTo<string>().Which.Should().NotBeEmpty();
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Never());
            _mocker.Mock<IVideoApiClient>().Verify(x => x.AddMagicLinkParticipantAsync(It.IsAny<Guid>(),
                It.IsAny<AddMagicLinkParticipantRequest>()), Times.Never);
        }
    }
}
