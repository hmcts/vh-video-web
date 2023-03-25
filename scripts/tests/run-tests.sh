#!/bin/sh
set -x

rm -d -r ${PWD}/Coverage
rm -d -r ${PWD}/TestResults
rm -d -r ${PWD}/VideoWeb/VideoWeb/ClientApp/coverage
rm -d -r ${PWD}/VideoWeb/VideoWeb/ClientApp/node_modules

configuration=Release
exclusions="[VideoWeb]VideoWeb.ConfigureServicesExtensions,[VideoWeb]VideoWeb.Program,[*]VideoWeb.Extensions.*[VideoWeb]VideoWeb.Startup,[Testing.Common]*,[VideoWeb.Common]VideoWeb.Common.*,[VideoWeb]VideoWeb.Security.*,[VideoWeb]VideoWeb.Configuration.*,[VideoWeb]VideoWeb.Pages.*,[VideoWeb.Testing.Common]*,[*]VideoWeb.Swagger.*"

dotnet build VideoWeb/VideoWeb.sln -c $configuration

# Script is for docker compose tests where the script is at the root level
dotnet test VideoWeb/VideoWeb.UnitTests/VideoWeb.UnitTests.csproj -c $configuration --no-build --results-directory ./TestResults --logger "trx;LogFileName=VideoWeb-Unit-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

# Run the Jasmine tests
cd VideoWeb/VideoWeb/ClientApp
npm install --prefix VideoWeb/VideoWeb/ClientApp
npm run --prefix VideoWeb/VideoWeb/ClientApp lint
npm run --prefix VideoWeb/VideoWeb/ClientApp test-once-ci
