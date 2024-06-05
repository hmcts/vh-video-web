using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using FluentAssertions;
using VideoApi.Client;
using Microsoft.AspNetCore.Http;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagement
{
    [TestFixture]
    class GetRecommendedLayoutForHearingTests
    {
        private ConferenceDto _conferenceDto;
        private ParticipantDto _judgeParticipantDto; 
        private AutoMock _mocker;
        private ConferenceManagementController _sut;

        [SetUp]
        public void SetUp()
        {
            _judgeParticipantDto = new ParticipantDto
            {
                Id = Guid.NewGuid(),
                Username = "first last"
            };

            _conferenceDto = new ConferenceDto()
            {
                Id = Guid.NewGuid(),
                Participants = new List<ParticipantDto>
                {
                    _judgeParticipantDto
                }
            };

            _mocker = AutoMock.GetLoose();
            _sut = _mocker.Create<ConferenceManagementController>();
            
            _sut.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipalBuilder()
                        .WithUsername(_judgeParticipantDto.Username)
                        .WithRole(AppRoles.JudgeRole).Build()
                }
            };
        }

        [Test]
        public async Task should_return_ok_with_the_recommended_layout()
        {
            // Arrange
            var expectedLayout = _conferenceDto.GetRecommendedLayout();
            
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _conferenceDto.Id))).ReturnsAsync(_conferenceDto);

            // Act
            var layoutResponse = await _sut.GetRecommendedLayoutForHearing(_conferenceDto.Id);

            // Assert
            layoutResponse.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().Be(expectedLayout);
        }

        [Test]
        public async Task should_return_an_status_code_if_a_video_api_exception_is_thrown_in_hearing_service()
        {
            // Arrange
            var statusCode = 123;
            
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _conferenceDto.Id))).ThrowsAsync(new VideoApiException("message", statusCode, null, null, null));
            // Act
            var layoutResponse = await _sut.GetRecommendedLayoutForHearing(_conferenceDto.Id);

            // Assert
            layoutResponse.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(statusCode);
        }

        [Test]
        public void should_return_an_internal_server_error_if_an_exception_is_thrown_in_hearing_service()
        {
            // Arrange
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _conferenceDto.Id))).ThrowsAsync(new Exception());

            // Act
            Assert.ThrowsAsync<Exception>(async () => await _sut.GetRecommendedLayoutForHearing(_conferenceDto.Id));
        }
    }
}
