using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.MagicLinkController
{
    public class GetMagicLinkParticipantRolesTests
    {
        private MagicLinksController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<ILogger<MagicLinksController>> _loggerMock;

        [SetUp]
        public void SetUp()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _loggerMock = new Mock<ILogger<MagicLinksController>>();
            
            _controller = new MagicLinksController(_videoApiClientMock.Object, _loggerMock.Object);
        }

        [Test]
        public void Should_return_magic_link_participant_roles()
        {
            //Arrange
            var expected = new List<Role>
            {
                Role.MagicLinkParticipant, Role.MagicLinkObserver
            };

            //Act
            var result = _controller.GetMagicLinkParticipantRoles() as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.AreEqual(expected, result.Value);
        }
    }
}
