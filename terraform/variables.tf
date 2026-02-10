variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
  default     = "dev"
}

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "fiap-tech-challenge-cluster"
}

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "ftc-app"
}

variable "service_account_name" {
  description = "Kubernetes service account name"
  type        = string
  default     = "billing-service"
}
