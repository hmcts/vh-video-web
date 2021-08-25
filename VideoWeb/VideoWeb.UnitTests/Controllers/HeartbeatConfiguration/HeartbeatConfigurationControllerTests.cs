using System;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Options;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.HeartbeatConfiguration
{
    [TestFixture]
    public class HeartbeatConfigurationControllerTests
    {
        private AutoMock _mocker;
        private HeartbeatConfigurationController _sut;
        private int _expiresInMinutes = 2;
        private string _heartbeatUrlBase = "url";
        
        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            var kinlyConfiguration = new KinlyConfiguration()
            {
                ExpiresInMinutes = _expiresInMinutes,
                HeartbeatUrlBase = _heartbeatUrlBase
            };
            
            _mocker.Mock<IOptions<KinlyConfiguration>>().SetupGet(x => x.Value).Returns(kinlyConfiguration);
            
            _sut = _mocker.Create<HeartbeatConfigurationController>();
        }

        [Test]
        public void Should_return_bad_request_when_participant_id_is_wrong()
        {
            // Act
            var response = _sut.GetConfigurationForParticipant(Guid.Empty);

            // Assert
            var modelState = response.Should().BeAssignableTo<BadRequestObjectResult>().
                Subject.Value.Should().BeAssignableTo<SerializableError>().Subject;
            modelState.Count.Should().Be(1);
            modelState.ContainsKey("participantId").Should().BeTrue();
        }

        [Test]
        public void Should_generate_a_jwt_for_the_participant_with_the_correct_parameters()
        {
            // Arrange
            Guid participantId = Guid.NewGuid();
            const string jwt = "jwt";
            
            _mocker.Mock<ICustomJwtTokenProvider>().Setup(x => x.GenerateToken(
                It.Is<string>(y => y == participantId.ToString()),
                It.Is<int>(y => y == _expiresInMinutes))
                ).Returns(jwt);
            
            // Act
            var response = _sut.GetConfigurationForParticipant(participantId);

            // Assert
            response.Should().BeAssignableTo<OkObjectResult>()
                .Subject.Value.Should().BeAssignableTo<HeartbeatConfigurationResponse>()
                .Subject.HeartbeatJwt.Should().Be(jwt);
            
            _mocker.Mock<ICustomJwtTokenProvider>().Verify(x => x.GenerateToken(
                It.Is<string>(y => y == participantId.ToString()), 
                It.Is<int>(y => y == _expiresInMinutes)
                ), Times.Once);
        }

        [Test]
        public void Should_set_the_heartbeat_url_base_from_the_config()
        {
            // Arrange
            Guid participantId = Guid.NewGuid();

            // Act
            var response = _sut.GetConfigurationForParticipant(participantId);

            // Assert
            response.Should().BeAssignableTo<OkObjectResult>()
                .Subject.Value.Should().BeAssignableTo<HeartbeatConfigurationResponse>()
                .Subject.HeartbeatUrlBase.Should().Be(_heartbeatUrlBase);
        }
    }
}
