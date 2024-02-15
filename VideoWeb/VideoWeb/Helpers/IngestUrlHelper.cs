using System;
using System.Text.RegularExpressions;

namespace VideoWeb.Helpers;

public static class IngestUrlHelper
{
    private const string Pattern = @"vh-recording-app\/(.+)";
    public static string GetAudioStreamFileName(this string ingestUrl)
    {
        var regex = new Regex(Pattern, RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(1000));
        var result = regex.Match(ingestUrl).Groups[1].Value;
        return string.IsNullOrWhiteSpace(result) ? null : result;
    }
}
