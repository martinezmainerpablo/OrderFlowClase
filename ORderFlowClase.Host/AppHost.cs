var builder = DistributedApplication.CreateBuilder(args);


var postgres = builder
    .AddPostgres("postgres")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithDataVolume("postgres-data-identity")
    .WithPgAdmin(pgAdmin => pgAdmin.WithHostPort(5050));


var db =  postgres.AddDatabase("identity");

var identity_1 = builder.AddProject<Projects.OrderFlowClase_API_Identity>("orderflowclase-api-identity")
    .WaitFor(db)
    .WithReference(db);

var identity_2 = builder.AddProject<Projects.OrderFlowClase_API_Identity>("orderflowclase-api-identity2")
    .WaitFor(db)
    .WithReference(db);

builder.AddProject<Projects.OrderFlowClase_ApiGateway>("orderflowclase-apigateway")
    .WithReference(identity_1)
    .WithReference(identity_2)
    .WaitFor(identity_1)
    .WaitFor(identity_2);

builder.Build().Run();
