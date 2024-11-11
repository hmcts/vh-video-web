using System.Threading;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching;

public interface IDistributedJohConsultationRoomLockCache
{
    Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName, CancellationToken cancellationToken = default);
    Task<bool> IsJohRoomLocked(string johConsultationRoomKey, CancellationToken cancellationToken = default);
}
