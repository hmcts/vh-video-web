using System.Collections.Generic;
using System.Linq;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using TestApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class UserDetailsResponseToUsersMapper
    {
        public static List<UserDto> Map(List<UserDetailsResponse> usersResponses)
        {
            return usersResponses.Select(user => new UserDto()
                {
                    Application = user.Application,
                    ContactEmail = user.ContactEmail,
                    CreatedDate = user.CreatedDate,
                    DisplayName = user.DisplayName,
                    FirstName = user.FirstName,
                    Id = user.Id,
                    IsProdUser = user.IsProdUser,
                    LastName = user.LastName,
                    Number = user.Number,
                    TestType = user.TestType,
                    UserType = user.UserType,
                    Username = user.Username
                })
                .ToList();
        }

        public static List<UserDto> Map(UserDetailsResponse user)
        {
            var u = new UserDto()
            {
                Application = user.Application,
                ContactEmail = user.ContactEmail,
                CreatedDate = user.CreatedDate,
                DisplayName = user.DisplayName,
                FirstName = user.FirstName,
                Id = user.Id,
                IsProdUser = user.IsProdUser,
                LastName = user.LastName,
                Number = user.Number,
                TestType = user.TestType,
                UserType = user.UserType,
                Username = user.Username
            };
            return new List<UserDto>(){u};
        }
    }
}
