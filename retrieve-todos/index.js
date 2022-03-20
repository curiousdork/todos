import DynamoDB from '@aws-sdk/client-dynamodb';
const REGION = process.env.REGION;


const retrieveTodos = async (event, ctx) => {

    return {
        statusCode: 200,
        body: JSON.stringify({})
    };
}

export default retrieveTodos;