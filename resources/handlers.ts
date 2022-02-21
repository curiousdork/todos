import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";

export const getTodosHandler: aws.lambda.EventHandler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Value' })
    }
}

export const createTodoHandler: aws.lambda.EventHandler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'item created' })
    }
}


export default {
    getTodosHandler,
    createTodoHandler
}