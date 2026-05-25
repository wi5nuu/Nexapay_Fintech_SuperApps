variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.29"
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the EKS node group"
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the EKS node group"
  type        = number
  default     = 3
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the EKS node group"
  type        = number
  default     = 20
}

variable "node_instance_types" {
  description = "Instance types for the EKS general node group"
  type        = list(string)
  default     = ["m6i.large", "m6a.large"]
}

variable "spot_instance_types" {
  description = "Instance types for the EKS spot node group"
  type        = list(string)
  default     = ["c6i.large", "c6a.large", "c5.large"]
}

variable "postgres_instance_class" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "postgres_allocated_storage" {
  description = "Allocated storage for PostgreSQL in GB"
  type        = number
  default     = 200
}

variable "postgres_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "nexapay"
  sensitive   = true
}

variable "postgres_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "mysql_instance_class" {
  description = "RDS MySQL instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "mysql_allocated_storage" {
  description = "Allocated storage for MySQL in GB"
  type        = number
  default     = 100
}

variable "mysql_username" {
  description = "MySQL master username"
  type        = string
  default     = "nexapay"
  sensitive   = true
}

variable "mysql_password" {
  description = "MySQL master password"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "kafka_broker_count" {
  description = "Number of MSK Kafka broker nodes"
  type        = number
  default     = 3
}

variable "kafka_instance_type" {
  description = "MSK Kafka broker instance type"
  type        = string
  default     = "kafka.m7g.large"
}

variable "kafka_volume_size" {
  description = "EBS volume size per Kafka broker in GB"
  type        = number
  default     = 1000
}

variable "kafka_username" {
  description = "Kafka SCRAM username"
  type        = string
  default     = "nexapay"
  sensitive   = true
}

variable "es_instance_type" {
  description = "OpenSearch instance type"
  type        = string
  default     = "r6g.large.search"
}

variable "es_instance_count" {
  description = "Number of OpenSearch instances"
  type        = number
  default     = 3
}

variable "es_volume_size" {
  description = "EBS volume size per OpenSearch node in GB"
  type        = number
  default     = 200
}

variable "es_username" {
  description = "OpenSearch master username"
  type        = string
  default     = "nexapay"
  sensitive   = true
}

variable "backup_retention_period" {
  description = "Number of days to retain database backups"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 90
}
