using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using UserApi.Contract.Responses;

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
                User_role = role,
                First_name = "Court 11",
                Last_name = "Taylor House",
                User_name = "Court 11, Taylor House"
            };
            var response = _sut.Map(profile);

            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(profile.First_name);
            response.LastName.Should().Be(profile.Last_name);
            response.DisplayName.Should().Be(profile.Display_name);
            response.Username.Should().Be(profile.User_name);
        }

        [Test]
        public void Should_throw_exception_when_role_is_unsupported()
        {
            Action action = () => _sut.Map(new UserProfile
            {
                User_role = "Random"
            });

            action.Should().Throw<NotSupportedException>().WithMessage("Role Random is not supported for this application");
        }
    }
}
