using System.Collections.Generic;

namespace VideoWeb.Helpers;

public static class HearingScottishVenueNames
{
    public const string Aberdeen = "Aberdeen Tribunal Hearing Centre";
    public const string Dundee = "Dundee Tribunal Hearing Centre";
    public const string Edinburgh = "Edinburgh Employment Tribunal";
    public const string Glasgow = "Glasgow Tribunals Centre";
    public const string Inverness = "Inverness Employment Tribunal";
    public const string Ayr = "Ayr";
    public const string HamiltonBrandonGate = "Hamilton Brandon Gate";
    public const string StirlingWallaceHouse = "Stirling Wallace House";
    public const string EdinburghEmploymentAppealTribunal = "Edinburgh Employment Appeal Tribunal";
    public const string InvernessJusticeCentre = "Inverness Justice Centre";
    public const string EdinburghSocialSecurityAndChildSupportTribunal = "Edinburgh Social Security and Child Support Tribunal";
    public const string EdinburghUpperTribunal = "Edinburgh Upper Tribunal (Administrative Appeals Chamber)";

    public static readonly IReadOnlyCollection<string> ScottishHearingVenuesList = new List<string> { 
        Aberdeen,
        Ayr,
        Dundee,
        Edinburgh,
        Glasgow,
        HamiltonBrandonGate,
        Inverness,
        StirlingWallaceHouse,
        EdinburghEmploymentAppealTribunal,
        InvernessJusticeCentre,
        EdinburghSocialSecurityAndChildSupportTribunal,
        EdinburghUpperTribunal,
    };
}

