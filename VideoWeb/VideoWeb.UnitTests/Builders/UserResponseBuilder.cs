using System.Collections.Generic;
using UserApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public static class UserResponseBuilder
    {
        public static List<UserResponse> BuildData()
        {
            return new List<UserResponse> {
                new UserResponse{FirstName="Manual03", LastName="Court room 01"},
                new UserResponse{FirstName="Manual01", LastName="Court room 03"},
                new UserResponse{FirstName="Manual01", LastName="Court room 02"},
                new UserResponse{FirstName="Manual02", LastName="Court room 01"},
                new UserResponse{FirstName="Manual02", LastName="Court room 02"},
                new UserResponse{FirstName="Manual01", LastName="Court room 01"}
            };
        }
    }
}
