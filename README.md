# CourseFlow

CourseFlow is a serverless web application developed for the Cloud Development final project.

The system helps students manage courses and assignments from one centralized dashboard. Users can add courses, create assignments, track open and completed tasks, and view their overall progress.

The project is deployed on AWS using serverless services, with a static frontend hosted on Amazon S3 and delivered through Amazon CloudFront.

---

## Live Demo

```text
https://courseflow.proj.rotem.click
```

---

## Project Goal

CourseFlow provides students with a simple way to:

* Manage courses.
* Add and track assignments.
* View progress and statistics.
* Store data persistently in DynamoDB.
* Access the system through HTTPS using a custom domain.

---

## Architecture

High-level request flow:

```text
User Browser
→ Route 53
→ CloudFront
→ S3 Frontend
→ API Gateway
→ Lambda
→ DynamoDB
```

Deployment flow:

```text
GitHub Repository
→ GitHub Actions
→ IAM OIDC Role
→ S3 Bucket
→ CloudFront Cache Invalidation
```

---

## AWS Services

The project uses the following AWS services:

* **Amazon S3** — hosts the static frontend files.
* **Amazon CloudFront** — delivers the website globally and provides HTTPS.
* **Amazon Route 53** — manages the custom domain.
* **AWS Certificate Manager** — provides the SSL/TLS certificate.
* **Amazon API Gateway** — exposes the backend API routes.
* **AWS Lambda** — runs the backend logic.
* **Amazon DynamoDB** — stores courses and assignments.
* **Amazon CloudWatch** — stores logs and supports debugging.
* **AWS IAM** — manages secure permissions between services.

---

## Main AWS Resources

```text
Website: https://courseflow.proj.rotem.click
S3 Bucket: courseflow-adyan-frontend
CloudFront Distribution ID: EKVXXEDUP75O6
CloudFront Domain: dv8mqv8vxzl2.cloudfront.net
API Gateway: CourseFlowHttpApi
Lambda Function: CourseFlowApi
DynamoDB Tables: CourseFlowCourses, CourseFlowAssignments
IAM Role: CourseFlowGitHubActionsRole
```

---

## API Routes

```text
GET     /courses
POST    /courses
GET     /assignments
POST    /assignments
PUT     /assignments/{id}
DELETE  /assignments/{id}
```

---

## GitHub Workflow

The project was managed using a branch-based workflow:

```text
Create branch
→ Make changes
→ Commit
→ Push
→ Open Pull Request
→ Run GitHub Actions
→ Merge to main
```

This helped keep the `main` branch stable and made changes easier to review.

---

## GitHub Actions

This repository includes two GitHub Actions workflows.

### 1. Project Files Check

```text
.github/workflows/main.yml
```

This workflow checks that the main project files exist:

```text
frontend/index.html
frontend/style.css
frontend/app.js
backend/lambda_function.py
README.md
```

### 2. Frontend Deployment to AWS

```text
.github/workflows/deploy-frontend.yml
```

This workflow automatically deploys the frontend to AWS by:

1. Authenticating to AWS using GitHub OIDC.
2. Uploading the `frontend` folder to S3.
3. Creating a CloudFront cache invalidation.

---

## Project Structure

```text
courseflow/
├── .github/
│   └── workflows/
│       ├── main.yml
│       └── deploy-frontend.yml
├── backend/
│   └── lambda_function.py
├── docs/
│   └── deployment.md
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

---

## Frontend

The frontend was built using:

* HTML
* CSS
* Vanilla JavaScript

It includes:

* Dashboard page.
* Course management.
* Assignment management.
* Course statistics.
* Progress tracking.

The frontend communicates with the backend through API Gateway using JavaScript `fetch`.

---

## Backend

The backend is implemented as a Python AWS Lambda function.

It handles course and assignment operations, communicates with DynamoDB, and returns JSON responses to the frontend through API Gateway.

---

## Security

Security decisions:

* No AWS access keys are stored in the repository.
* GitHub Actions uses OIDC to authenticate with AWS.
* IAM permissions are limited to the required actions.
* CloudFront uses HTTPS with an ACM certificate.
* Lambda uses an execution role to access AWS services.
* CloudWatch logs are used for monitoring and troubleshooting.

---

## Final Status

Completed components:

```text
Frontend hosting on S3 ✅
CloudFront distribution ✅
Custom domain and HTTPS ✅
Route 53 DNS records ✅
API Gateway routes ✅
Lambda backend ✅
DynamoDB database ✅
CloudWatch logs ✅
IAM and OIDC security ✅
GitHub Actions checks ✅
GitHub Actions frontend deployment ✅
```

CourseFlow is fully deployed on AWS and available through the production domain.
