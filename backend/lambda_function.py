import json
import os
import uuid
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key


# DynamoDB table names
COURSES_TABLE = os.environ.get("COURSES_TABLE", "CourseFlowCourses")
ASSIGNMENTS_TABLE = os.environ.get("ASSIGNMENTS_TABLE", "CourseFlowAssignments")

dynamodb = boto3.resource("dynamodb")
courses_table = dynamodb.Table(COURSES_TABLE)
assignments_table = dynamodb.Table(ASSIGNMENTS_TABLE)


def lambda_handler(event, context):
    """
    Main Lambda entry point.
    This function receives requests from API Gateway and routes them
    to the correct handler according to HTTP method and path.
    """

    try:
        method = event.get("requestContext", {}).get("http", {}).get("method")
        path = event.get("rawPath", "")

        # CORS preflight
        if method == "OPTIONS":
            return response(200, {"message": "CORS preflight OK"})

        # Courses routes
        if method == "GET" and path == "/courses":
            return get_courses()

        if method == "POST" and path == "/courses":
            return create_course(event)

        # Assignments routes
        if method == "GET" and path == "/assignments":
            return get_assignments()

        if method == "POST" and path == "/assignments":
            return create_assignment(event)

        if method == "PUT" and path.startswith("/assignments/"):
            assignment_id = path.split("/")[-1]
            return update_assignment(event, assignment_id)

        if method == "DELETE" and path.startswith("/assignments/"):
            assignment_id = path.split("/")[-1]
            return delete_assignment(assignment_id)

        return response(404, {"message": "Route not found"})

    except Exception as error:
        print("ERROR:", str(error))
        return response(500, {"message": "Internal server error", "error": str(error)})


# =========================
# Courses
# =========================

def get_courses():
    result = courses_table.scan()
    courses = result.get("Items", [])

    return response(200, courses)


def create_course(event):
    body = parse_body(event)

    course_name = body.get("name", "").strip()
    course_code = body.get("code", "").strip()
    color = body.get("color", "#6366f1")

    if not course_name:
        return response(400, {"message": "Course name is required"})

    course = {
        "id": str(uuid.uuid4()),
        "name": course_name,
        "code": course_code,
        "color": color,
        "createdAt": datetime.utcnow().isoformat()
    }

    courses_table.put_item(Item=course)

    return response(201, course)


# =========================
# Assignments
# =========================

def get_assignments():
    result = assignments_table.scan()
    assignments = result.get("Items", [])

    return response(200, assignments)


def create_assignment(event):
    body = parse_body(event)

    course_id = body.get("courseId", "").strip()
    title = body.get("title", "").strip()
    deadline = body.get("deadline", "")
    priority = body.get("priority", "Medium")
    status = body.get("status", "Open")

    if not course_id:
        return response(400, {"message": "Course ID is required"})

    if not title:
        return response(400, {"message": "Assignment title is required"})

    assignment = {
        "id": str(uuid.uuid4()),
        "courseId": course_id,
        "title": title,
        "deadline": deadline,
        "priority": priority,
        "status": status,
        "createdAt": datetime.utcnow().isoformat()
    }

    assignments_table.put_item(Item=assignment)

    return response(201, assignment)


def update_assignment(event, assignment_id):
    body = parse_body(event)

    new_status = body.get("status")

    if not new_status:
        return response(400, {"message": "Status is required"})

    allowed_statuses = ["Open", "In Progress", "Done"]

    if new_status not in allowed_statuses:
        return response(400, {"message": "Invalid status value"})

    assignments_table.update_item(
        Key={"id": assignment_id},
        UpdateExpression="SET #status = :status",
        ExpressionAttributeNames={
            "#status": "status"
        },
        ExpressionAttributeValues={
            ":status": new_status
        }
    )

    return response(200, {
        "message": "Assignment status updated",
        "id": assignment_id,
        "status": new_status
    })


def delete_assignment(assignment_id):
    assignments_table.delete_item(
        Key={"id": assignment_id}
    )

    return response(200, {
        "message": "Assignment deleted",
        "id": assignment_id
    })


# =========================
# Helpers
# =========================

def parse_body(event):
    body = event.get("body")

    if not body:
        return {}

    if isinstance(body, dict):
        return body

    return json.loads(body)


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
        },
        "body": json.dumps(body)
    }