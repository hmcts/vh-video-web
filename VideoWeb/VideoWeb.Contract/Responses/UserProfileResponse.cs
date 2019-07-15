namespace VideoWeb.Contract.Responses
{
    public class UserProfileResponse
    {
        public UserRole Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string DisplayName { get; set; }
    }
}