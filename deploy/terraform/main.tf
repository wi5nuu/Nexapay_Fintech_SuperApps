terraform {
  backend "s3" {
    bucket         = "nexapay-terraform-state"
    key            = "nexapay/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "nexapay-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "NexaPay"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "NexaPay-Platform-Team"
    }
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# --- VPC ---
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "nexapay-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names[*]
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = var.environment == "dev"
  enable_dns_hostnames   = true
  enable_dns_support     = true
  enable_vpn_gateway     = false

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# --- EKS Cluster ---
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "nexapay-${var.environment}-cluster"
  cluster_version = var.eks_cluster_version

  cluster_endpoint_public_access = var.environment == "dev"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_addons = {
    coredns                = {}
    eks-pod-identity-agent = {}
    kube-proxy             = {}
    vpc-cni                = {}
  }

  eks_managed_node_groups = {
    general = {
      desired_size = var.node_group_desired_size
      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size

      instance_types = var.node_instance_types

      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 100
            volume_type           = "gp3"
            encrypted             = true
            delete_on_termination = true
          }
        }
      }

      labels = {
        role = "general"
      }

      update_config = {
        max_unavailable_percentage = 33
      }
    }

    spot = {
      desired_size = 0
      min_size     = 0
      max_size     = 20

      instance_types = var.spot_instance_types
      capacity_type  = "SPOT"

      labels = {
        role = "spot"
      }

      taints = {
        spot = {
          key    = "spot"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      }
    }
  }

  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    ingress_cluster_to_node_all = {
      description = "Cluster to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      source_cluster_security_group = true
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}

# --- RDS PostgreSQL (Auth, Users, Wallets, Loans) ---
resource "aws_db_subnet_group" "postgres" {
  name       = "nexapay-${var.environment}-postgres-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_db_instance" "postgres" {
  identifier = "nexapay-${var.environment}-postgres"

  engine                           = "postgres"
  engine_version                   = "15.7"
  instance_class                   = var.postgres_instance_class
  allocated_storage                = var.postgres_allocated_storage
  max_allocated_storage            = 1000
  storage_type                     = "gp3"
  storage_encrypted                = true

  db_name  = "nexapay"
  username = var.postgres_username
  password = var.postgres_password
  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.postgres.id]

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment == "dev"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  parameters = [
    {
      name  = "log_statement"
      value = "ddl"
    },
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements,pg_cron"
    }
  ]
}

# --- RDS MySQL (Reporting) ---
resource "aws_db_instance" "mysql" {
  identifier = "nexapay-${var.environment}-mysql"

  engine                           = "mysql"
  engine_version                   = "8.0.35"
  instance_class                   = var.mysql_instance_class
  allocated_storage                = var.mysql_allocated_storage
  max_allocated_storage            = 500
  storage_type                     = "gp3"
  storage_encrypted                = true

  db_name  = "nexapay_reporting"
  username = var.mysql_username
  password = var.mysql_password
  port     = 3306

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.mysql.id]

  backup_retention_period = var.backup_retention_period
  backup_window           = "04:00-05:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment == "dev"

  enabled_cloudwatch_logs_exports = ["audit", "error", "general", "slowquery"]
}

# --- ElastiCache Redis ---
resource "aws_elasticache_subnet_group" "redis" {
  name       = "nexapay-${var.environment}-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "nexapay-${var.environment}-redis"
  description          = "NexaPay Redis cluster for caching, sessions, rate limiting"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.redis_node_type
  num_cache_clusters = var.environment == "production" ? 2 : 1

  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"

  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true

  maintenance_window = "sun:06:00-sun:07:00"

  log_delivery_configuration {
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_group        = "/aws/elasticache/nexapay-redis"
  }
}

# --- MSK (Kafka) ---
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "nexapay-${var.environment}-kafka"
  kafka_version          = "3.6.0"
  number_of_broker_nodes = var.kafka_broker_count

  broker_node_group_info {
    instance_type   = var.kafka_instance_type
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.kafka.id]

    storage_info {
      ebs_storage_info {
        volume_size = var.kafka_volume_size
      }
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  client_authentication {
    unauthenticated = false
    sasl {
      scram = true
      iam   = true
    }
  }

  open_monitoring {
    prometheus {
      jmx_exporter {
        enabled_in_broker = true
      }
      node_exporter {
        enabled_in_broker = true
      }
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = "/aws/msk/nexapay-kafka"
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka_config.arn
    revision = aws_msk_configuration.kafka_config.latest_revision
  }
}

resource "aws_msk_configuration" "kafka_config" {
  kafka_versions = ["3.6.0"]
  name           = "nexapay-${var.environment}-kafka-config"

  server_properties = <<PROPERTIES
auto.create.topics.enable = true
delete.topic.enable = true
log.retention.hours = 168
log.retention.bytes = 1073741824
default.replication.factor = 3
min.insync.replicas = 2
num.partitions = 3
PROPERTIES
}

resource "aws_msk_scram_secret_association" "kafka_scram" {
  cluster_arn     = aws_msk_cluster.kafka.arn
  secret_arn_list = [aws_secretsmanager_secret.kafka_scram.arn]
}

resource "aws_secretsmanager_secret" "kafka_scram" {
  name = "nexapay-${var.environment}-kafka-scram"
}

resource "aws_secretsmanager_secret_version" "kafka_scram" {
  secret_id     = aws_secretsmanager_secret.kafka_scram.id
  secret_string = jsonencode({
    username = var.kafka_username
    password = random_password.kafka_scram.result
  })
}

resource "random_password" "kafka_scram" {
  length  = 32
  special = false
}

# --- OpenSearch (Elasticsearch) ---
resource "aws_opensearch_domain" "elasticsearch" {
  domain_name    = "nexapay-${var.environment}"
  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type          = var.es_instance_type
    instance_count         = var.es_instance_count
    zone_awareness_enabled = var.environment == "production"

    vpc_options {
      subnet_ids         = module.vpc.private_subnets
      security_group_ids = [aws_security_group.opensearch.id]
    }
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.es_volume_size
    volume_type = "gp3"
  }

  encrypt_at_rest {
    enabled = true
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "TLSSecurityPolicy-TLS-1-2-2019-07"
  }

  log_publishing_options {
    log_type                 = "INDEX_SLOW_LOGS"
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_index_logs.arn
  }

  log_publishing_options {
    log_type                 = "SEARCH_SLOW_LOGS"
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.es_search_logs.arn
  }

  advanced_security_options {
    enabled                        = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = var.es_username
      master_user_password = random_password.es_master.result
    }
  }

  access_policies = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = module.eks.cluster_iam_role_arn
        }
        Action = "es:*"
        Resource = "arn:aws:es:${var.aws_region}:${data.aws_caller_identity.current.account_id}:domain/nexapay-${var.environment}/*"
      }
    ]
  })
}

resource "random_password" "es_master" {
  length  = 24
  special = false
}

resource "aws_cloudwatch_log_group" "es_index_logs" {
  name              = "/aws/opensearch/nexapay-${var.environment}/index-slow-logs"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "es_search_logs" {
  name              = "/aws/opensearch/nexapay-${var.environment}/search-slow-logs"
  retention_in_days = 30
}

# --- S3 Buckets ---
resource "aws_s3_bucket" "kyc_documents" {
  bucket = "nexapay-${var.environment}-kyc-documents"
}

resource "aws_s3_bucket_versioning" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "kyc_documents" {
  bucket                  = aws_s3_bucket.kyc_documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "user_avatars" {
  bucket = "nexapay-${var.environment}-user-avatars"
}

resource "aws_s3_bucket_versioning" "user_avatars" {
  bucket = aws_s3_bucket.user_avatars.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "user_avatars" {
  bucket = aws_s3_bucket.user_avatars.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "user_avatars" {
  bucket                  = aws_s3_bucket.user_avatars.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "nexapay-${var.environment}-alb-logs"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = "nexapay-${var.environment}-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# --- DynamoDB for Terraform locks ---
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "nexapay-${var.environment}-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }
}

# --- Security Groups ---
resource "aws_security_group" "postgres" {
  name        = "nexapay-${var.environment}-postgres-sg"
  description = "NexaPay PostgreSQL security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Postgres from EKS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_security_group" "mysql" {
  name        = "nexapay-${var.environment}-mysql-sg"
  description = "NexaPay MySQL security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "MySQL from EKS"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_security_group" "redis" {
  name        = "nexapay-${var.environment}-redis-sg"
  description = "NexaPay Redis security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Redis from EKS"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_security_group" "kafka" {
  name        = "nexapay-${var.environment}-kafka-sg"
  description = "NexaPay Kafka security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Kafka from EKS"
    from_port   = 9092
    to_port     = 9096
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

resource "aws_security_group" "opensearch" {
  name        = "nexapay-${var.environment}-opensearch-sg"
  description = "NexaPay OpenSearch security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "OpenSearch from EKS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }
}

# --- ECR Repositories ---
resource "aws_ecr_repository" "services" {
  for_each = toset([
    "auth", "user-kyc", "wallet", "loan", "investment",
    "notification", "reporting", "fraud-detection", "api-gateway"
  ])
  name                 = "nexapay/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
  }
}

# --- IAM Roles for EKS Service Accounts ---
resource "aws_iam_role" "nexapay_sa" {
  name = "nexapay-${var.environment}-eks-sa-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${module.eks.oidc_provider}:sub" = "system:serviceaccount:nexapay:nexapay-sa"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "nexapay_sa_s3_scoped" {
  name   = "nexapay-${var.environment}-s3-scoped"
  role   = aws_iam_role.nexapay_sa.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::nexapay-${var.environment}-kyc-documents",
          "arn:aws:s3:::nexapay-${var.environment}-kyc-documents/*",
          "arn:aws:s3:::nexapay-${var.environment}-user-avatars",
          "arn:aws:s3:::nexapay-${var.environment}-user-avatars/*",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "nexapay_sa_ecr" {
  role       = aws_iam_role.nexapay_sa.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy" "nexapay_sa_msk_scoped" {
  name   = "nexapay-${var.environment}-msk-scoped"
  role   = aws_iam_role.nexapay_sa.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kafka:DescribeCluster",
          "kafka:GetBootstrapBrokers",
          "kafka-cluster:Connect",
          "kafka-cluster:DescribeTopic",
          "kafka-cluster:ReadData",
          "kafka-cluster:WriteData",
        ]
        Resource = "arn:aws:kafka:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/nexapay-${var.environment}/*"
      },
    ]
  })
}

# --- CloudWatch Log Groups ---
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/nexapay-${var.environment}-cluster"
  retention_in_days = var.log_retention_days
}

data "aws_caller_identity" "current" {}
