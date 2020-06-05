using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Common.SignalR;
using VideoWeb.Services.User;

namespace VideoWeb.UnitTests.Hub
{
    public class AdUserProfileServiceTests
    {
        private Mock<IUserApiClient> _userApiClientMock;
        private AdUserProfileService _adUserProfileService;

        [SetUp]
        public void Setup()
        {
            _userApiClientMock = new Mock<IUserApiClient>();
            _adUserProfileService = new AdUserProfileService(_userApiClientMock.Object);
        }

        [Test]
        public async Task Should_return_obfuscated_username()
        {
            var userProfile = new UserProfile { User_role = "VhOfficer", User_name = "vhOfficer.User@email.com", First_name = "Manual", Last_name = "User"};
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ReturnsAsync(userProfile);

            var obfuscatedUsername = "M***** U***";
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.User_name);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_empty_string_if_user_profile_incorrect()
        {
            var userProfile = new UserProfile { User_role = "VhOfficer", User_name = "vhOfficer.User@email.com", First_name = "Manual", Last_name = "User" };
            var apiException = new UserApiException("User does not exist", (int)HttpStatusCode.NotFound,
                "Invalid User Id", null, null);
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ThrowsAsync(apiException);

            var obfuscatedUsername = string.Empty;
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.User_name);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task should_return_profile_by_username()
        {
            var username = "judge@test.com";
            var role = Role.Judge.ToString();
            var profile =  Builder<UserProfile>.CreateNew()
                .With(x => x.User_name = username)
                .With(x => x.User_role = role)
                .Build();
            _userApiClientMock.Setup(x => 
                    x.GetUserByAdUserNameAsync(It.Is<string>(x => x == username)))
                .ReturnsAsync(profile);

            var result = await _adUserProfileService.GetUserAsync(username);
            result.Should().BeEquivalentTo(profile);
            
            var emptyResult = await _adUserProfileService.GetUserAsync("doesNot@Exist.com");
            emptyResult.Should().BeNull();
        }
    }
}
