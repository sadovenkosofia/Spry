FROM public.ecr.aws/lambda/python:3.11

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY . .

CMD [ "app.reports.lambda_handler.handler" ]
