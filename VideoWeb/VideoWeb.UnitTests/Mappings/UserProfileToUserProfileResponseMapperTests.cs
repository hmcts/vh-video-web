using System;
using FluentAssertions;
using NUnit.Framework;
using UserApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class UserProfileToUserProfileResponseMapperTests : BaseMockerSutTestSetup<UserProfileToUserProfileResponseMapper>
    {
        [TestCase("VhOfficer", Role.VideoHearingsOfficer)]
        [TestCase("Representative", Role.Representative)]
        [TestCase("Individual", Role.Individual)]
        [TestCase("Judge", Role.Judge)]
        [TestCase("CaseAdmin", Role.CaseAdmin)]
        [TestCase("JudicialOfficeHolder", Role.JudicialOfficeHolder)]
        public void Should_map_to_user_role(string role, Role expectedRole)
        {
            var profile = new UserProfile
            {
                UserRole = role,
                FirstName = "Court 11",
                LastName = "Taylor House",
                UserName = "Court 11, Taylor House"
            };
            var response = _sut.Map(profile);

            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(profile.FirstName);
            response.LastName.Should().Be(profile.LastName);
            response.DisplayName.Should().Be(profile.DisplayName);
            response.Username.Should().Be(profile.UserName);
        }

        [Test]
        public void Should_throw_exception_when_role_is_unsupported()
        {
            Action action = () => _sut.Map(new UserProfile
            {
                UserRole = "Random"
            });

            action.Should().Throw<NotSupportedException>().WithMessage("Role Random is not supported for this application");
        }
    }
}
