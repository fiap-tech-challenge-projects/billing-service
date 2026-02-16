terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 - bucket configured dynamically via terraform init -backend-config
  backend "s3" {
    key            = "billing-service/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fiap-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

data "aws_eks_cluster" "cluster" {
  name = var.eks_cluster_name
}

data "tls_certificate" "eks" {
  url = data.aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}
