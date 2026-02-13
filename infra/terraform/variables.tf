variable "project" {
  type        = string
  description = "Project slug used for naming."
  default     = "cv-web"
}

variable "environment" {
  type        = string
  description = "Environment name (dev/staging/prod)."
}

variable "aws_region" {
  type        = string
  description = "AWS region."
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
  default     = "10.20.0.0/16"
}

variable "domain_name" {
  type        = string
  description = "Primary DNS name for the application."
}

variable "db_name" {
  type        = string
  description = "PostgreSQL database name."
  default     = "cv"
}

variable "db_username" {
  type        = string
  description = "PostgreSQL username."
  default     = "app"
}

variable "db_password" {
  type        = string
  description = "PostgreSQL password."
  sensitive   = true
}
