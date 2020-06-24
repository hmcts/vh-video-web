using System.Collections.Generic;
using VideoWeb.Services.User;

namespace VideoWeb.UnitTests.Builders
{
    public static class UserResponseBuilder
    {
        public static List<UserResponse> BuildData()
        {
            return new List<UserResponse> {
                new UserResponse{First_name="Manual03", Last_name="Court room 01"},
                new UserResponse{First_name="Manual01", Last_name="Court room 03"},
                new UserResponse{First_name="Manual01", Last_name="Court room 02"},
                new UserResponse{First_name="Manual02", Last_name="Court room 01"},
                new UserResponse{First_name="Manual02", Last_name="Court room 02"},
                new UserResponse{First_name="Manual01", Last_name="Court room 01"}
            };
        }
    }
}
