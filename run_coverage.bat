rmdir /q /s Artifacts

SET exclude=\"[VideoWeb]VideoWeb.ConfigureServicesExtensions,[VideoWeb]VideoWeb.Program,[VideoWeb]VideoWeb.Startup,[*]VideoWeb.Common.*,[*]VideoWeb.Extensions.*,[*]VideoWeb.Pages.*,[*]VideoWeb.Swagger.*,[*]VideoWeb.Views.*,[*]VideoWeb.UnitTests.*,[*]VideoWeb.Services.*,[*]Testing.Common.*,[*]VideoWeb.UnitTests.*"
dotnet test VideoWeb/VideoWeb/VideoWeb.UnitTests/VideoWeb.UnitTests.csproj /p:CollectCoverage=true /p:CoverletOutputFormat="\"opencover,cobertura,json,lcov\"" /p:CoverletOutput=../Artifacts/Coverage/ /p:MergeWith='../Artifacts/Coverage/coverage.json' /p:Exclude="${exclude}"

reportgenerator -reports:Artifacts/Coverage/coverage.opencover.xml -targetDir:Artifacts/Coverage/Report -reporttypes:HtmlInline_AzurePipelines

"Artifacts/Coverage/Report/index.htm"