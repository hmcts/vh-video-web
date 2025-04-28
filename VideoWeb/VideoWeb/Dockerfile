FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:22.0.0-alpine AS client
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app
COPY VideoWeb/VideoWeb/ClientApp .
RUN npm ci --ignore-scripts && npm run build-prod

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY VideoWeb .
RUN dotnet restore --configfile nuget.config "VideoWeb/VideoWeb.csproj"
WORKDIR "/src/VideoWeb"
RUN dotnet build "VideoWeb.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VideoWeb.csproj" -c Release -o /app/publish

FROM base AS final
RUN apt-get update  \
    && apt-get --no-install-recommends install -y curl  \
    && apt-get clean  \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist/browser/ /app/ClientApp/dist/
ENTRYPOINT ["dotnet", "VideoWeb.dll"]
