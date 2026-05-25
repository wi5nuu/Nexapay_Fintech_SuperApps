output "vpc_id" {
  description = "ID of the NexaPay VPC"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

output "eks_cluster_endpoint" {
  description = "Endpoint URL for the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_oidc_provider" {
  description = "OIDC provider URL for the EKS cluster"
  value       = module.eks.oidc_provider
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = module.eks.oidc_provider_arn
}

output "eks_node_security_group_id" {
  description = "Security group ID for EKS nodes"
  value       = module.eks.node_security_group_id
}

output "postgres_endpoint" {
  description = "Connection endpoint for the PostgreSQL RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "postgres_port" {
  description = "Port for the PostgreSQL RDS instance"
  value       = aws_db_instance.postgres.port
}

output "postgres_database_name" {
  description = "Database name for PostgreSQL"
  value       = aws_db_instance.postgres.db_name
}

output "mysql_endpoint" {
  description = "Connection endpoint for the MySQL RDS instance"
  value       = aws_db_instance.mysql.endpoint
}

output "mysql_port" {
  description = "Port for the MySQL RDS instance"
  value       = aws_db_instance.mysql.port
}

output "mysql_database_name" {
  description = "Database name for MySQL"
  value       = aws_db_instance.mysql.db_name
}

output "redis_primary_endpoint" {
  description = "Primary endpoint for the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint" {
  description = "Reader endpoint for the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "redis_port" {
  description = "Port for the ElastiCache Redis cluster"
  value       = aws_elasticache_replication_group.redis.port
}

output "kafka_bootstrap_brokers_tls" {
  description = "TLS bootstrap brokers string for Kafka"
  value       = aws_msk_cluster.kafka.bootstrap_brokers_tls
  sensitive   = true
}

output "kafka_bootstrap_brokers_sasl_scram" {
  description = "SASL/SCRAM bootstrap brokers string for Kafka"
  value       = aws_msk_cluster.kafka.bootstrap_brokers_sasl_scram
  sensitive   = true
}

output "kafka_zookeeper_connect" {
  description = "ZooKeeper connection string for Kafka"
  value       = aws_msk_cluster.kafka.zookeeper_connect_string
  sensitive   = true
}

output "opensearch_endpoint" {
  description = "Endpoint URL for OpenSearch (Elasticsearch)"
  value       = aws_opensearch_domain.elasticsearch.endpoint
}

output "opensearch_dashboard_endpoint" {
  description = "OpenSearch Dashboards (Kibana) endpoint URL"
  value       = aws_opensearch_domain.elasticsearch.dashboard_endpoint
}

output "s3_kyc_bucket" {
  description = "S3 bucket name for KYC documents"
  value       = aws_s3_bucket.kyc_documents.bucket
}

output "s3_avatar_bucket" {
  description = "S3 bucket name for user avatars"
  value       = aws_s3_bucket.user_avatars.bucket
}

output "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  value = {
    for k, repo in aws_ecr_repository.services : k => repo.repository_url
  }
}

output "nexapay_sa_role_arn" {
  description = "IAM role ARN for the NexaPay Kubernetes service account"
  value       = aws_iam_role.nexapay_sa.arn
}

output "dynamodb_terraform_locks" {
  description = "DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}
