import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { UserService } from '../../services/userService';

const userService = new UserService();

export async function createUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Create user function processed a request.');

    try {
        if (request.method !== 'POST') {
            return {
                status: 405,
                jsonBody: { error: 'Method not allowed' }
            };
        }

        const body = await request.json() as any;
        context.log('Received body:', JSON.stringify(body));

        if (!body.entra_oid || !body.email) {
            context.log('Missing required fields:', {
                entra_oid: !!body.entra_oid,
                email: !!body.email,
                first_name: !!body.first_name,
                last_name: !!body.last_name
            });
            return {
                status: 400,
                jsonBody: {
                    error: 'Missing required fields: entra_oid, email',
                    received: Object.keys(body)
                }
            };
        }

        // Handle empty names from Entra ID
        const firstName = body.first_name?.trim() || 'User';
        const lastName = body.last_name?.trim() || '';

        context.log('Processed names:', { firstName, lastName });

        const user = await userService.createUser({
            entra_oid: body.entra_oid,
            email: body.email,
            first_name: firstName,
            last_name: lastName,
            account_status: body.account_status || 'incomplete'
        });

        return {
            status: 201,
            jsonBody: {
                user: {
                    user_id: user.user_id,
                    entra_oid: user.entra_oid,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    account_status: user.account_status,
                    first_login_completed: user.first_login_completed
                }
            }
        };
    } catch (error: any) {
        context.error('Error creating user:', error);

        if (error.message.includes('already exists')) {
            return {
                status: 409,
                jsonBody: { error: error.message }
            };
        }

        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

export async function getUserByOid(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Get user by OID function processed a request.');

    try {
        if (request.method !== 'GET') {
            return {
                status: 405,
                jsonBody: { error: 'Method not allowed' }
            };
        }

        const entraOid = request.params.oid;
        if (!entraOid) {
            return {
                status: 400,
                jsonBody: { error: 'Missing entra_oid parameter' }
            };
        }

        const user = await userService.getUserByEntraOid(entraOid);
        if (!user) {
            return {
                status: 404,
                jsonBody: { error: 'User not found' }
            };
        }

        // Debug: Log the actual user object to see what fields it has
        context.log('User object from database:', JSON.stringify(user, null, 2));

        return {
            status: 200,
            jsonBody: {
                user: {
                    user_id: user.user_id,
                    entra_oid: user.entra_oid,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    account_status: user.account_status,
                    first_login_completed: user.first_login_completed
                }
            }
        };
    } catch (error: any) {
        context.error('Error getting user:', error);
        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

export async function updateUserStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Update user status function processed a request.');

    try {
        if (request.method !== 'PATCH') {
            return {
                status: 405,
                jsonBody: { error: 'Method not allowed' }
            };
        }

        const entraOid = request.params.oid;
        if (!entraOid) {
            return {
                status: 400,
                jsonBody: { error: 'Missing entra_oid parameter' }
            };
        }

        const body = await request.json() as any;
        if (!body.account_status || !['incomplete', 'complete'].includes(body.account_status)) {
            return {
                status: 400,
                jsonBody: { error: 'Invalid or missing account_status. Must be "incomplete" or "complete"' }
            };
        }

        const user = await userService.updateUserStatus(entraOid, body.account_status);

        return {
            status: 200,
            jsonBody: {
                user: {
                    user_id: user.user_id,
                    entra_oid: user.entra_oid,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    account_status: user.account_status,
                    first_login_completed: user.first_login_completed
                }
            }
        };
    } catch (error: any) {
        context.error('Error updating user status:', error);

        if (error.message.includes('not found')) {
            return {
                status: 404,
                jsonBody: { error: error.message }
            };
        }

        return {
            status: 500,
            jsonBody: { error: 'Internal server error' }
        };
    }
}

// Register the Azure Functions
app.http('createUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'auth/users',
    handler: createUser
});

app.http('getUserByOid', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'auth/users/{oid}',
    handler: getUserByOid
});

app.http('updateUserStatus', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'auth/users/{oid}/status',
    handler: updateUserStatus
});