namespace VideoWeb.Common.Models;

/// <summary>
/// This class is to represent a parameterless constructor for the Claim class.
/// </summary>
public class CustomClaim
{
    public string Type { get; set; }
    public string Value { get; set; }
    
    public CustomClaim() { }
    
    public System.Security.Claims.Claim ToClaim()
    {
        return new System.Security.Claims.Claim(Type, Value);
    }
}
