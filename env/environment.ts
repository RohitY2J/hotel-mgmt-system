export const environment = {
    SERVER_URL: 'http://localhost:8000',
    /* local */
    //CAS_SERVER_URL: 'https://localhost:7264',
    //REDIRECT_URI: 'http://localhost:4200/callback',
    
    /* docker */
    CAS_SERVER_URL: 'http://localhost:5000',
    REDIRECT_URI: 'http://localhost:8000/callback',
    BASE_HREF: '/',
    APPLICATION_ID: '9bd07b95-87c5-4c56-8ed3-70f50ea9a9e8',
    TENANT_ID: 'c6cea979-afdf-4756-8dd7-90af6b3edeb7'
};

export const testEnv = {
    FRONTEND_URL: 'http://localhost:8000',

}