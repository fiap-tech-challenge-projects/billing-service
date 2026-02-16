# IRSA Role for Billing Service
resource "aws_iam_role" "billing_service" {
  name = "fiap-billing-service-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}:sub" = "system:serviceaccount:ftc-app-${var.environment}:${var.service_account_name}"
            "${replace(data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "fiap-billing-service-${var.environment}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Policy for DynamoDB access
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "dynamodb-access"
  role = aws_iam_role.billing_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/fiap-budgets-${var.environment}",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/fiap-budgets-${var.environment}/index/*",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/fiap-payments-${var.environment}",
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/fiap-payments-${var.environment}/index/*"
        ]
      }
    ]
  })
}

# Policy for EventBridge access
resource "aws_iam_role_policy" "eventbridge_access" {
  name = "eventbridge-access"
  role = aws_iam_role.billing_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/fiap-tech-challenge-event-bus"
        ]
      }
    ]
  })
}

# Policy for SQS access (for event consumers)
resource "aws_iam_role_policy" "sqs_access" {
  name = "sqs-access"
  role = aws_iam_role.billing_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:fiap-billing-*"
        ]
      }
    ]
  })
}
