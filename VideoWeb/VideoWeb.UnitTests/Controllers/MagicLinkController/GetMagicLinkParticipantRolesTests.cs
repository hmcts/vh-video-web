using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using VideoApi.Client;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.MagicLinkController
{
    public class GetMagicLinkParticipantRolesTests
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
