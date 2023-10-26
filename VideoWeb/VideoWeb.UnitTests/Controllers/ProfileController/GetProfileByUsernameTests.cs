using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

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
        _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UserProfile, UserProfileResponse>()).Returns(_mocker.Create<UserProfileToUserProfileResponseMapper>());
        _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ClaimsPrincipal, UserProfileResponse>()).Returns(_mocker.Create<ClaimsPrincipalToUserProfileResponseMapper>());
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
