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
        public void should_map_to_user_role(string role, UserRole expectedRole)
        {
            var response = _mapper.MapToResponseModel(new UserProfile()
            {
                User_role = role
            });

            response.Role.Should().Be(expectedRole);
        }
        
        [Test]
        public void should_throw_exception_when_role_is_unsupported()
        {
            Action action = () => _mapper.MapToResponseModel(new UserProfile()
            {
                User_role = "Random"
            });

            action.Should().Throw<NotSupportedException>();
        }
    }
}