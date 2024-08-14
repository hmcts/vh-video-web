using System.Threading;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching
{
    public interface IDistributedJOHConsultationRoomLockCache
    {
        Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName, CancellationToken cancellationToken = default);
        Task<bool> IsJOHRoomLocked(string johConsultationRoomKey, CancellationToken cancellationToken = default);
    }
}
