exports.handler = async (event, context) => {
    const message = {
        version: '1.0.0',
        status: 'green'
    };
    
    return {
        statusCode: 200,
        body: JSON.stringify(message)
    }
}