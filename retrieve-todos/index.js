exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify([
            {
                name: 'Test TODO item',
                completed: false,
                dueDate: new Date()
            }
        ])
    }
}