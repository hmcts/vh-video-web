using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;

namespace VideoWeb.UnitTests.Mappings
{
    public class UserProfileResponseMapperTests
    {
        private UserProfileResponseMapper _mapper;
        
        [OneTimeSetUp]
        public void OneTimeSetup()
        {
            _mapper = new UserProfileResponseMapper();
        }
        
        [TestCase("VhOfficer", UserRole.VideoHearingsOfficer)]
        [TestCase("Representative", UserRole.Representative)]
        [TestCase("Individual", UserRole.Individual)]
        [TestCase("Judge", UserRole.Judge)]
        [TestCase("CaseAdmin", UserRole.CaseAdmin)]
        public void Should_map_to_user_role(string role, UserRole expectedRole)
        {
            var profile = new UserProfile
            {
                User_role = role,
                First_name = "Court 11",
                Last_name = "Taylor House",
                User_name = "Court 11, Taylor House"
            };
            var response = _mapper.MapToResponseModel(profile);

            response.Role.Should().Be(expectedRole);
            response.FirstName.Should().Be(profile.First_name);
            response.LastName.Should().Be(profile.Last_name);
            response.DisplayName.Should().Be(profile.Display_name);
        }
        
        [Test]
        public void Should_throw_exception_when_role_is_unsupported()
        {
            Action action = () => _mapper.MapToResponseModel(new UserProfile
            {
                User_role = "Random"
            });

            action.Should().Throw<NotSupportedException>();
        }
    }
}