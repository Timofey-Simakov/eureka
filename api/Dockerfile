FROM golang:1.22 AS build
WORKDIR /app
COPY api/go.mod api/go.sum ./
RUN go mod download
COPY api/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./cmd/server

FROM gcr.io/distroless/base-debian12
ENV API_ADDR=:8080
COPY --from=build /bin/api /bin/api
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/bin/api"]
