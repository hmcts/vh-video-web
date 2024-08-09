using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers.ProfileController;

[TestFixture]
public class GetProfileByUsernameTests
{
    private AutoMock _mocker;
    private ProfilesController _controller;

    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _controller = _mocker.Create<ProfilesController>();
    }

    [Test]
    public async Task GetProfileByUsernameAsync_ReturnsOkResult_WhenProfileExists()
    {
        // Arrange
        var username = "johndoe";
        var profile = new UserProfile() {UserName = username, FirstName = "John", LastName = "Doe", Email = username};
        _mocker.Mock<IUserProfileService>().Setup(x => x.GetUserAsync(username)).ReturnsAsync(profile);

        // Act
        var result = await _controller.GetProfileByUsernameAsync(username);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var okResult = result as OkObjectResult;
        var responseDto = okResult!.Value as UserProfileResponse;
        responseDto!.FirstName.Should().Be(profile.FirstName);
        responseDto!.Username.Should().Be(profile.UserName);
    }

    [Test]
    public async Task GetProfileByUsernameAsync_ReturnsNotFoundResult_WhenProfileDoesNotExist()
    {
        // Arrange
        var username = "johndoe";
        _mocker.Mock<IUserProfileService>().Setup(x => x.GetUserAsync(username)).ReturnsAsync((UserProfile) null);

        // Act
        var result = await _controller.GetProfileByUsernameAsync(username);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }
}
