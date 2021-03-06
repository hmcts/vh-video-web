using FluentAssertions;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.Common.SignalR;
using UserApi.Client;
using UserApi.Contract.Responses;

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
            var userProfile = new UserProfile { UserRole = "VhOfficer", UserName = "vhOfficer.User@hmcts.net", FirstName = "Manual", LastName = "User"};
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ReturnsAsync(userProfile);

            var obfuscatedUsername = "M***** U***";
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_empty_string_if_user_profile_incorrect()
        {
            var userProfile = new UserProfile { UserRole = "VhOfficer", UserName = "vhOfficer.User@hmcts.net", FirstName = "Manual", LastName = "User" };
            var apiException = new UserApiException("User does not exist", (int)HttpStatusCode.NotFound,
                "Invalid User Id", null, null);
            _userApiClientMock.Setup(x => x.GetUserByAdUserNameAsync(It.IsAny<string>())).ThrowsAsync(apiException);

            var obfuscatedUsername = string.Empty;
            var result = await _adUserProfileService.GetObfuscatedUsernameAsync(userProfile.UserName);
            result.Should().Be(obfuscatedUsername);
        }

        [Test]
        public async Task Should_return_profile_by_username()
        {
            var username = "judge@hmcts.net";
            var role = Role.Judge.ToString();
            var profile =  Builder<UserProfile>.CreateNew()
                .With(x => x.UserName = username)
                .With(x => x.UserRole = role)
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
