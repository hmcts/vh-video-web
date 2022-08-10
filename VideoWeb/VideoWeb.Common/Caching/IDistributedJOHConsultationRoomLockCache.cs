using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public interface IDistributedJOHConsultationRoomLockCache
    {
        Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName);
        Task<bool> IsJOHRoomLocked(string johConsultationRoomKey);
    }
}
