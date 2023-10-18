using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Helpers.Sorting;

/// <summary>
/// Sorts a list of conferences for a VHO officer. Order is:
/// Non closed conferences, sorted by scheduled date time then case name
/// Then closed conferences sorted by scheduled date time, then case name
/// </summary>
public class SortConferenceForVhoOfficerHelper : IComparer<ConferenceForVhOfficerResponse>
{
    public int Compare(ConferenceForVhOfficerResponse x, ConferenceForVhOfficerResponse y)
    {
        if (ReferenceEquals(x, y)) return 0;
        if (ReferenceEquals(null, y)) return 1;
        if (ReferenceEquals(null, x)) return -1;

        var conferenceStatusCompare = CompareStatus(x, y);
        if (conferenceStatusCompare != 0) return conferenceStatusCompare;

        if (x.Status == ConferenceStatus.Closed && y.Status == ConferenceStatus.Closed)
        {
            return CompareClosedConference(x, y);
        }

        return CompareNonClosedConference(x, y);
    }

    private static int CompareNonClosedConference(ConferenceForVhOfficerResponse x, ConferenceForVhOfficerResponse y)
    {
        if (x.ScheduledDateTime == y.ScheduledDateTime)
        {
            return string.CompareOrdinal(x.CaseName, y.CaseName);
        }

        return x.ScheduledDateTime > y.ScheduledDateTime ? 1 : -1;
    }

    private static int CompareClosedConference(ConferenceForVhOfficerResponse x, ConferenceForVhOfficerResponse y)
    {
        if (x.ClosedDateTime == y.ClosedDateTime)
        {
            return string.CompareOrdinal(x.CaseName, y.CaseName);
        }

        return x.ScheduledDateTime > y.ScheduledDateTime ? 1 : -1;
    }

    private static int CompareStatus(ConferenceForVhOfficerResponse x, ConferenceForVhOfficerResponse y)
    {
        if (x.Status == ConferenceStatus.Closed && y.Status != ConferenceStatus.Closed)
        {
            return 1;
        }

        if (y.Status == ConferenceStatus.Closed && x.Status != ConferenceStatus.Closed)
        {
            return -1;
        }

        return 0;
    }
}
