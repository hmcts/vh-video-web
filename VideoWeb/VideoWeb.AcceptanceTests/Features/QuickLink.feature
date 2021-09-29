@ChromeOnly @WindowsOnly
Feature: QuickLink
	Simple calculator for adding two numbers

Scenario: VHO Copies Hearing ID to Clipboard
	Given the Video Hearings Officer user has progressed to the VHO Hearing List page
  When the Video Hearings Officer clicks <copylink>
  Then the <copylink> is in the clipboard
  Examples:
  | copylink          |
  | Hearing ID        |
  | QuickLink Details |
  | Phone Details     |
