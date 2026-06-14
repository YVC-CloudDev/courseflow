# CourseFlow

CourseFlow is a serverless course and assignment management system deployed on AWS.

## Project Overview

CourseFlow helps students manage their courses and assignments from one simple web interface.

The system allows users to:
- View dashboard statistics
- Add and manage courses
- Add and track assignments
- Monitor assignment progress

## Team Responsibilities

### GitHub / Repository Management
Responsible for:
- Repository structure
- Git branches
- Pull requests
- GitHub Actions workflow
- README documentation

### AWS / Cloud Deployment
Responsible for:
- AWS S3 static website hosting
- API Gateway
- AWS Lambda
- DynamoDB
- CloudWatch monitoring
- IAM permissions
- HTTPS / CloudFront deployment

## Technologies Used

- HTML
- CSS
- JavaScript
- Python
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- GitHub Actions

## Project Structure

```text
courseflow/
├── .github/
│   └── workflows/
│       └── main.yml
├── backend/
│   └── lambda_function.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md