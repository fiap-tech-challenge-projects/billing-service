output "iam_role_arn" {
  description = "IAM role ARN for billing service"
  value       = aws_iam_role.billing_service.arn
}

output "iam_role_name" {
  description = "IAM role name for billing service"
  value       = aws_iam_role.billing_service.name
}
