AWS_REGION ?= eu-north-1
ECR_REGISTRY ?= 594559484590.dkr.ecr.$(AWS_REGION).amazonaws.com
S3_BUCKET ?= spry-frontend-shymchuks-sudo
CLOUDFRONT_DIST_ID ?= E28WXS7KZKWV0G

# LLM settings (Bedrock, us-east-1). Change the model here, nowhere else.
PARSER_MODEL ?= us.anthropic.claude-haiku-4-5-20251001-v1:0
PYTHON ?= python

.PHONY: build-local up-local deploy-frontend deploy-backend report-now llm-hello parse

# Local Development
up-local:
	docker compose up --build

# Deployment commands
deploy-frontend:
	cd frontend && npm ci && npm run build
	aws s3 sync frontend/dist/ s3://$(S3_BUCKET)/ --delete
	aws cloudfront create-invalidation --distribution-id $(CLOUDFRONT_DIST_ID) --paths "/*"

deploy-backend:
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $(ECR_REGISTRY)
	docker build -t $(ECR_REGISTRY)/spry-backend:latest ./backend
	docker push $(ECR_REGISTRY)/spry-backend:latest
	aws ecs update-service --cluster spry-cluster --service spry-backend-service --force-new-deployment

report-now:
	@WEEK=$${WEEK:-$$(date +%Y-W%V)} ; \
	ACCOUNT_ID=$$(aws sts get-caller-identity --query Account --output text) ; \
	QUEUE_URL="https://sqs.us-east-1.amazonaws.com/$${ACCOUNT_ID}/spry-report-requests" ; \
	echo "Sending report request for week: $${WEEK}" ; \
	aws sqs send-message \
		--queue-url "$${QUEUE_URL}" \
		--message-body "{\"week\": \"$${WEEK}\", \"source\": \"make-command\"}"

llm-hello:
	cd backend && PARSER_MODEL="$(PARSER_MODEL)" $(PYTHON) scripts/llm_hello.py

parse:
	cd backend && PARSER_MODEL="$(PARSER_MODEL)" PYTHONPATH=. TEXT="$(TEXT)" $(PYTHON) scripts/parse_agenda.py
