#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM gittools/gitversion:5.3.5-linux-alpine.3.10-x64-netcoreapp3.1 AS gitversion
WORKDIR /version 
COPY .git .git
RUN /tools/dotnet-gitversion /ensureassemblyinfo /updateassemblyinfo AssemblyInfo.cs /nofetch /config /GitVersion.yml

FROM mcr.microsoft.com/dotnet/core/aspnet:3.1-buster-slim AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:14.15-alpine AS client
ARG skip_client_build=false
WORKDIR /app
COPY VideoWeb/VideoWeb/ClientApp .
RUN [[ ${skip_client_build} = true ]] && echo "Skipping npm install" || npm install
RUN [[ ${skip_client_build} = true ]] && mkdir dist || npm run-script build-prod

FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster AS build
WORKDIR /src
COPY VideoWeb .
RUN dotnet restore --configfile nuget.config "VideoWeb/VideoWeb.csproj"
WORKDIR "/src/VideoWeb"
COPY --from=gitversion /version/AssemblyInfo.cs .
RUN dotnet build "VideoWeb.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VideoWeb.csproj" -c Release -o /app/publish -p:PublishRunWebpack=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist /app/ClientApp/dist
ENTRYPOINT ["dotnet", "VideoWeb.dll"]
