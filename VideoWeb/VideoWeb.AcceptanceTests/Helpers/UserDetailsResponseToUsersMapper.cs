using System.Collections.Generic;
using System.Linq;
using VideoWeb.Services.TestApi;

namespace VideoWeb.AcceptanceTests.Helpers
{
    public static class UserDetailsResponseToUsersMapper
    {
        public static List<User> Map(List<UserDetailsResponse> usersResponses)
        {
            return usersResponses.Select(user => new User()
                {
                    Application = user.Application,
                    Contact_email = user.Contact_email,
                    Created_date = user.Created_date,
                    Display_name = user.Display_name,
                    First_name = user.First_name,
                    Id = user.Id,
                    Is_prod_user = user.Is_prod_user,
                    Last_name = user.Last_name,
                    Number = user.Number,
                    Test_type = user.Test_type,
                    User_type = user.User_type,
                    Username = user.Username
                })
                .ToList();
        }

        public static List<User> Map(UserDetailsResponse user)
        {
            var u = new User()
            {
                Application = user.Application,
                Contact_email = user.Contact_email,
                Created_date = user.Created_date,
                Display_name = user.Display_name,
                First_name = user.First_name,
                Id = user.Id,
                Is_prod_user = user.Is_prod_user,
                Last_name = user.Last_name,
                Number = user.Number,
                Test_type = user.Test_type,
                User_type = user.User_type,
                Username = user.Username
            };
            return new List<User>(){u};
        }
    }
}
