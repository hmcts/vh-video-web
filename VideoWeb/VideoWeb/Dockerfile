FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM node:22.0.0-alpine AS client
ENV PUPPETEER_SKIP_DOWNLOAD=true
ARG skip_client_build=false
WORKDIR /app
COPY VideoWeb/VideoWeb/ClientApp .
RUN if [[ ${skip_client_build} = true ]]; then \
    echo "Skipping npm install and build"; \
    mkdir dist; \
    else \
    npm install --ignore-scripts && npm run-script build-prod; \
    fi


FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY VideoWeb .
RUN dotnet restore --configfile nuget.config "VideoWeb/VideoWeb.csproj"
WORKDIR "/src/VideoWeb"
RUN dotnet build "VideoWeb.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VideoWeb.csproj" -c Release -o /app/publish -p:PublishRunWebpack=false

FROM base AS final
RUN apt-get update && apt-get install -y curl && apt-get clean
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=client /app/dist /app/ClientApp/dist
ENTRYPOINT ["dotnet", "VideoWeb.dll"]
