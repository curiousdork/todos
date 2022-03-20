import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as mongo from '@pulumi/mongodbatlas';

const config = new pulumi.Config();
const env = config.get('environment');

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
  runtime: 'nodejs16.x',
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
  runtime: 'nodejs16.x',
  memorySize: 256,
  architectures: ['arm64'],
  name: `retrieveTodos-${env}`,
});

