# AWS staging

The staging stack follows the repository deployment plan: one EC2 instance runs the Spring Boot API, MySQL 8.4, and Caddy. MySQL and Caddy state live on an encrypted 30 GiB gp3 EBS root volume. The EC2 security group exposes only TCP 80 and 443; administration uses Systems Manager Session Manager, and port 22 is closed.

The CloudFormation template is intended for `ap-southeast-1` and the account's default VPC. It allocates an Elastic IP and uses an `sslip.io` hostname so Caddy can obtain HTTPS without a purchased domain. The endpoint is suitable for staging; replace it with a project-owned domain before production.

The instance bootstrap generates database passwords and a JWT secret on the host, stores them in `/opt/storage/repo/infra/ec2/.env.staging` with mode `0600`, then builds and starts the Docker Compose stack. The VNPay values are sandbox placeholders from the local example and must be replaced with issued sandbox credentials before testing checkout.

The EC2 role grants Systems Manager access only. The instance does not have an SSH key, an inbound SSH rule, an ECR permission, or permission to read arbitrary application secrets.

To create the stack from AWS CloudShell in `ap-southeast-1`:

```bash
aws cloudformation create-stack \
  --stack-name swp391-backend-staging \
  --template-url https://raw.githubusercontent.com/WindFaculty/SWP391_Self-Storage-Facility-Rental-and-Management-System/main/infra/aws/staging.yaml \
  --capabilities CAPABILITY_IAM
```

After `CREATE_COMPLETE`, wait for the EC2 instance bootstrap to finish. The API hostname and base URL are available in the CloudFormation stack outputs. Configure the GitHub Actions repository variable `VITE_API_BASE_URL` to the `ApiBaseUrl` output, then run the existing CI workflow with `workflow_dispatch` to rebuild and publish the frontend.

To inspect startup logs, connect to the instance using Session Manager and read `/var/log/user-data.log`. Do not print or commit `.env.staging`.
