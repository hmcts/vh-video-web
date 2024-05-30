using System.Collections.Generic;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Mvc;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.QuickLinkController
{
    public class GetQuickLinkParticipantRolesTests
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
        public void Should_return_quick_link_participant_roles()
        {
            //Arrange
            var expected = new List<Role>
            {
                Role.QuickLinkParticipant, Role.QuickLinkObserver
            };

            //Act
            var result = _controller.GetQuickLinkParticipantRoles() as OkObjectResult;

            //Assert
            Assert.IsInstanceOf<OkObjectResult>(result);
            Assert.AreEqual(expected, result.Value);
        }
    }
}
