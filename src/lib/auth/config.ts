/**
 * AWS Cognito configuration for Amplify v6
 */

export const awsConfig = {
  // V6 config structure
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
    userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    cookieStorage: {
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'localhost',
      path: '/',
      expires: 365,
      secure: process.env.NODE_ENV === 'production',
    },
    authenticationFlowType: 'USER_SRP_AUTH',
  }
};
