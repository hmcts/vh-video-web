using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Mappings;

public static class RoomSummaryResponseMapper 
{
    /// <summary>
    /// Mapped from video api response
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static RoomSummaryResponse Map(RoomResponse input)
    {
        if (input == null)
            return null;
        
        return new RoomSummaryResponse
        {
            Id = input.Id.ToString(), Label = input.Label, Locked = input.Locked
        };
    }
    
    /// <summary>
    /// Mapped from dto
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static RoomSummaryResponse Map(ConsultationRoom input)
    {
        if (input == null)
        {
            return null;
        }
        
        return new RoomSummaryResponse
        {
            Id = input.Id.ToString(),
            Label = input.Label,
            Locked = input.Locked
        };
    }
    
    /// <summary>
    /// Mapped from dto civillian room
    /// </summary>
    /// <param name="input"></param>
    /// <returns></returns>
    public static RoomSummaryResponse Map(CivilianRoom input)
    {
        if(input != null)
        {
            return new RoomSummaryResponse
            {
                Id = input.Id.ToString(),
                Label = input.RoomLabel
            };
        }
        
        return null;
    }
}
