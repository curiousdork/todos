import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

const config = new pulumi.Config()
const env = config.get('environment')

const todosTable = new aws.dynamodb.Table(`todos-dynamodb-table-${env}`, {
    attributes: [
        {
            name: "todoId",
            type: "S",
        },
        {
            name: "title",
            type: "S",
        },
        {
            name: "description",
            type: "S",
        },
    ],
    billingMode: "PROVISIONED",
    hashKey: "todoId",
    rangeKey: "title",
    readCapacity: 20,
    tags: {
        Environment: `${env}`,
        Name: `todos-table-${env}`,
    },
    ttl: {
        attributeName: "TimeToExist",
        enabled: false,
    },
    writeCapacity: 20,
});

const iamForLambda = new aws.iam.Role('iamForLambda', {
  assumeRolePolicy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Effect": "Allow",
        "Sid": ""
      }
    ]
  }
  `,
})

const pingLambda = new aws.lambda.Function(`ping-${env}`, {
  role: iamForLambda.arn,
  code: new pulumi.asset.AssetArchive({
    '.': new pulumi.asset.FileArchive('./ping'),
  }),
  handler: 'index.handler',
  runtime: 'nodejs14.x',
  memorySize: 256,
  architectures: ['arm64'],
  name: `ping-${env}`
});

const retrieveTodosLambda = new aws.lambda.Function(`retrieveTodos-${env}`, {
    role: iamForLambda.arn,
  code: new pulumi.asset.AssetArchive({
    '.': new pulumi.asset.FileArchive('./retrieve-todos'),
  }),
  handler: 'index.handler',
  runtime: 'nodejs14.x',
  memorySize: 256,
  architectures: ['arm64'],
  name: `retrieveTodos-${env}`,
})

const apigw = new aws.apigatewayv2.Api('httpApiGateway', {
  protocolType: 'HTTP',
})

new aws.lambda.Permission(
  'pingLambdaPermission',
  {
    action: 'lambda:InvokeFunction',
    principal: 'apigateway.amazonaws.com',
    function: pingLambda,
    sourceArn: pulumi.interpolate`${apigw.executionArn}/*/*`,
  },
  { dependsOn: [apigw, pingLambda,] },
)

new aws.lambda.Permission(
    'retrieveTodosLambdaPermission',
    {
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      function: retrieveTodosLambda,
      sourceArn: pulumi.interpolate`${apigw.executionArn}/*/*`,
    },
    { dependsOn: [apigw, retrieveTodosLambda,] },
  )

const pingIntegration = new aws.apigatewayv2.Integration(`pingLambdaIntegration-${env}`, {
  apiId: apigw.id,
  integrationType: 'AWS_PROXY',
  integrationUri: pingLambda.arn,
  integrationMethod: 'GET',
  payloadFormatVersion: '2.0',
  passthroughBehavior: 'WHEN_NO_MATCH',
});

const retrieveTodosIntegration = new aws.apigatewayv2.Integration('retrieveTodosLambdaIntegration-${env}', {
    apiId: apigw.id,
    integrationType: 'AWS_PROXY',
    integrationUri: retrieveTodosLambda.arn,
    integrationMethod: 'GET',
    payloadFormatVersion: '2.0',
    passthroughBehavior: 'WHEN_NO_MATCH',
  });

const pingRoute = new aws.apigatewayv2.Route(`pingApiRoute${env?.toUpperCase()}`, {
  apiId: apigw.id,
  routeKey: 'GET /ping',
  target: pulumi.interpolate`integrations/${pingIntegration.id}`,
});

const retrieveTodosRoute = new aws.apigatewayv2.Route(`retrieveTodosRoute${env?.toUpperCase()}`, {
    apiId: apigw.id,
    routeKey: 'GET /todos',
    target: pulumi.interpolate`integrations/${retrieveTodosIntegration.id}`,
  })

const stage = new aws.apigatewayv2.Stage(
  'apiStage',
  {
    apiId: apigw.id,
    name: env,
    routeSettings: [
      {
        routeKey: pingRoute.routeKey,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      {
        routeKey: retrieveTodosRoute.routeKey,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      }
    ],
    autoDeploy: true,
  },
  { dependsOn: [pingRoute, retrieveTodosRoute] },
)

export const endpoint = pulumi.interpolate`${apigw.apiEndpoint}/${stage.name}`
