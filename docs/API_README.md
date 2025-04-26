# FreestyleFiend Backend

Serverless backend for the FreestyleFiend app, built with AWS CDK (TypeScript), DynamoDB (single-table), S3, Cognito, and API Gateway. Includes robust OpenAPI documentation, full Jest test coverage, and CI/CD via GitHub Actions.

---

## Features
- **Domain-Driven, Serverless Architecture**: Follows DDD, Twelve-Factor, and AWS best practices.
- **DynamoDB Single-Table Design**: Efficient, scalable, and extensible entity modeling ([docs/dynamodb-design.md](./docs/dynamodb-design.md)).
- **API Gateway (REST, Cognito Auth)**: Secure endpoints for recordings, voting, leaderboard, and beats.
- **OpenAPI Spec**: [api/openapi.yaml](./api/openapi.yaml) — always up-to-date.
- **Comprehensive Testing**: Jest unit tests for all Lambda logic.
- **CI/CD**: Automated with GitHub Actions ([.github/workflows/ci.yml](./.github/workflows/ci.yml)).

---

## Quick Start

```sh
# Install dependencies
npm install

# Synthesize CDK (see CloudFormation output)
npx cdk synth

# Run all unit tests
npm test

# Deploy to your AWS account (requires credentials)
npm run deploy
```

---

## Integration Testing (End-to-End)

You can run real HTTP integration tests against your deployed API using Jest and axios.

### Prerequisites
- Your backend must be deployed and accessible via API Gateway.
- You need a valid Cognito JWT for an authenticated user.

#### **How to Get a Cognito JWT (No Frontend Required)**
1. **Find your Cognito User Pool App Client ID** (see AWS Console or CDK output).
2. **Register a user (if needed):**
   ```sh
   aws cognito-idp sign-up \
     --client-id <YOUR_APP_CLIENT_ID> \
     --username <YOUR_EMAIL> \
     --password <YOUR_PASSWORD>
   ```
   - You may need to confirm the user (via email or admin action).
3. **Authenticate and get your JWT:**
   ```sh
   aws cognito-idp initiate-auth \
     --auth-flow USER_PASSWORD_AUTH \
     --client-id <YOUR_APP_CLIENT_ID> \
     --auth-parameters USERNAME=<YOUR_EMAIL>,PASSWORD=<YOUR_PASSWORD>
   ```
   - The output will include `IdToken`, `AccessToken`, and `RefreshToken`.
   - Use the `IdToken` or `AccessToken` as your JWT for Authorization.

### Steps
1. **Set environment variables:**
   - `API_BASE_URL`: Your API Gateway base URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)
   - `COGNITO_JWT`: The JWT you obtained above (for endpoints that require auth)

2. **Run integration tests:**
   ```sh
   API_BASE_URL=https://your-api-url COGNITO_JWT=your-jwt npm run test:integration
   ```
   - This runs `/tests/integration/api.integration.test.ts` and exercises all major API flows.
   - Output will show which endpoints succeeded or failed.

3. **Test file location:**
   - See [`/tests/integration/api.integration.test.ts`](./tests/integration/api.integration.test.ts) for test source and scenarios.

---

## 🧪 Running Tests

### Unit Tests
- Run all unit tests (Lambdas, models, etc):
  ```bash
  npm run test:unit
  ```

### Integration Tests
- Requires environment variables:
  - `API_BASE_URL` (your deployed API Gateway URL)
  - `COGNITO_JWT` (see JWT automation section below)
- Run all integration tests:
  ```bash
  npm run test:integration
  ```
- Integration tests will fail if required env vars are not set.
- **Note:** Integration tests are designed to work with any user account that already exists and is confirmed in Cognito. You do not need to register a new user for each run, but the user must be in the Cognito User Pool and able to sign in.

### All Tests
- To run all tests (unit + integration):
  ```bash
  npm test
  ```
- Note: Integration tests require env vars as described above.

---

## 🛠️ Automated JWT Retrieval for Integration Tests

To run integration tests that require Cognito authentication, use the provided script to fetch a JWT token for your test user.

### 1. Prerequisites
- Node.js 18+
- ts-node installed (`npm install -D ts-node`)
- Your Cognito User Pool ID, App Client ID, and a test user with a confirmed email in the pool

### 2. Usage

```bash
npm run get-jwt
```

You will be prompted for your Cognito username/email, password, App Client ID, and User Pool ID. Optionally, you can provide these as environment variables:

- `COGNITO_USER` (username/email)
- `COGNITO_PASSWORD`
- `COGNITO_CLIENT_ID`
- `COGNITO_USER_POOL_ID`
- `AWS_REGION` (default: us-east-1)

Example:
```bash
COGNITO_USER=your@email.com COGNITO_PASSWORD=yourpassword COGNITO_CLIENT_ID=xxxx COGNITO_USER_POOL_ID=us-east-1_xxxxx npm run get-jwt
```

This will print your JWT token to stdout.

### 3. Running Integration Tests

Set the JWT as an environment variable and run the tests:

```bash
export COGNITO_JWT=$(npm run get-jwt --silent)
export API_BASE_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod
npm run test:integration
```

You can also combine these steps:
```bash
COGNITO_USER=your@email.com COGNITO_PASSWORD=yourpassword COGNITO_CLIENT_ID=xxxx COGNITO_USER_POOL_ID=us-east-1_xxxxx \
  API_BASE_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod \
  COGNITO_JWT=$(npm run get-jwt --silent) npm run test:integration
```

- **Works with any existing Cognito user:** As long as the user is confirmed in the User Pool, you can use their credentials for integration testing. No special test user is required.
- **No manual JWT copy-paste needed:** The script automates JWT retrieval for both local and CI/CD workflows.

---

## ⚡️ Developer Experience
- No more manual JWT copy-paste for integration tests.
- Script works locally and in CI/CD (set secrets as env vars).
- Follows Twelve-Factor App and security best practices.

---

## 🚀 Frontend Handoff Checklist

To enable frontend engineers to build against the FreestyleFiend backend, provide them with the following resources:

### 1. API Base URL
- https://yq51xd1d5a.execute-api.us-east-1.amazonaws.com/prod

### 2. OpenAPI/Swagger Documentation
- See [`openapi.yaml`](./openapi.yaml) for a machine-readable API spec (importable into Swagger UI, Postman, etc.)

### 3. Example HTTP Requests
- See [`api/integration-examples.http`](./api/integration-examples.http) for real-world request/response samples

### 4. Authentication Details
- AWS Cognito User Pool ID: (ask backend engineer or see deployment output)
- AWS Cognito App Client ID: (ask backend engineer or see deployment output)
- All endpoints except `GET /recordings/{id}` require a valid JWT (see below)

### 5. JWT Retrieval for Local Testing
- Use the script [`scripts/get-jwt.ts`](./scripts/get-jwt.ts) or `npm run get-jwt` for easy JWT token retrieval
- See [Automated JWT Retrieval for Integration Tests](#-automated-jwt-retrieval-for-integration-tests) above for workflow

### 6. API Overview
- See the [API Overview](#api-overview) section above for a summary of endpoints, methods, and authentication requirements

### 7. Contact
- For backend support or questions, contact the backend engineering team or refer to this README

---

## API Overview

- **POST /recordings** (auth): Create new recording, receive S3 presigned upload URL
- **GET /recordings**: List all recordings
- **GET /recordings/{id}**: Fetch single recording
- **POST /votes** (auth): Upvote/downvote a recording
- **GET /votes**: List votes for a recording
- **GET /leaderboard**: Top recordings for a date
- **GET /beats**: List available beats

See [api/openapi.yaml](./api/openapi.yaml) for full details and schemas.

---

## Beats Endpoint

### GET /beats

- Returns a list of all available beats with metadata and presigned S3 URLs for audio and image.
- **Authentication:** None (public endpoint)
- **Response Example:**

```json
[
  {
    "beatId": "celestial",
    "title": "Celestial",
    "producer": "FreeBeats.io",
    "genre": "Hip-Hop",
    "bpm": 163,
    "duration": "3:24",
    "tags": ["Atmospheric", "Chill", "Vibe"],
    "description": "Chill, atmospheric hip-hop beat.",
    "audioUrl": "https://your-s3-bucket.s3.amazonaws.com/beats/celestial.mp3?...",
    "imageUrl": "https://your-s3-bucket.s3.amazonaws.com/beats/images/celestial.png?..."
  }
]
```

- **See also:** `/data/beats-with-urls.json` for a local dump of all beats with public S3 URLs (useful for frontend prototyping).

---

## Testing

- **Run all tests:**
  ```sh
  npm test
  ```
- **Test files:** See [tests/lambda/](./tests/lambda/)
- **CI:** All pushes/PRs are checked by GitHub Actions.

---

## Project Structure

- `/lambda` — Lambda function handlers
- `/lib` — CDK stack definitions
- `/api` — OpenAPI spec and TypeScript types
- `/docs` — Architecture and DynamoDB design docs
- `/tests` — Jest unit tests
- `.github/workflows` — CI/CD pipelines

---

## Contributing

1. Fork and clone the repo
2. Create a feature branch
3. Commit and push your changes
4. Open a pull request

---

## License
MIT
