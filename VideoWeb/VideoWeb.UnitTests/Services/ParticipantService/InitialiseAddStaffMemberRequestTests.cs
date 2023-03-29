using Autofac.Extras.Moq;
using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Consts;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Services.ParticipantService
{
    public class InitialiseAddStaffMemberRequestTests
    {
        private AutoMock _mocker;
        private VideoWeb.Services.ParticipantService _service;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _service = _mocker.Create<VideoWeb.Services.ParticipantService>();
        }
        
        [Test]
        public void Should_return_addStaffMemberRequest()
        {
            var contactEmail = "staffMemberEmail@hmcts.net";
            var username = "staffMemberUsername@username.com";
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(Role.StaffMember.ToString()).WithUsername(username).Build();
            var staffMemberProfile = new UserProfileResponse
            {
                FirstName = "FirstName",
                LastName = "LastName",
                Username = username,
                DisplayName = "DisplayName",
                Name = "FullName"
            };
            
            var result = _service.InitialiseAddStaffMemberRequest(staffMemberProfile, contactEmail, claimsPrincipal);
            var expected = new AddStaffMemberRequest
            {
                FirstName = staffMemberProfile.FirstName,
                LastName = staffMemberProfile.LastName,
                Username = claimsPrincipal.Identity!.Name,
                HearingRole = HearingRoleName.StaffMember,
                Name = staffMemberProfile.Name,
                DisplayName = staffMemberProfile.DisplayName,
                UserRole = UserRole.StaffMember,
                ContactEmail = contactEmail
            };
            result.Should().BeEquivalentTo(expected);
        }
    }
}
