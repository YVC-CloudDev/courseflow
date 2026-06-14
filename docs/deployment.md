# CourseFlow Deployment Documentation

## Deployment Overview

CourseFlow is planned to be deployed using AWS serverless services.

The deployment flow is:

```text
User Browser
    ↓
Amazon CloudFront
    ↓
Amazon S3 Frontend Hosting
    ↓
Amazon API Gateway
    ↓
AWS Lambda
    ↓
Amazon DynamoDB