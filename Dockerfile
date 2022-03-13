# For more information, please refer to https://aka.ms/vscode-docker-python
FROM python:3.9-alpine as compile-image
# Install pip requirements
COPY requirements.txt .
RUN apk add --virtual .build-deps gcc libffi-dev musl-dev
RUN pip install --user -r requirements.txt



FROM python:3.9-alpine
EXPOSE 8001
# Keeps Python from generating .pyc files in the container
ENV PYToplin/noteboHONDONTWRITEBYTECODE=1
# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

COPY --from=compile-image /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
WORKDIR /app
COPY . /app

# Creates a non-root user with an explicit UID and adds permission to access the /app folder
# For more info, please refer to https://aka.ms/vscode-docker-python-configure-containers
#RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
#USER appuser

# During debugging, this entry point will be overridden. For more information, please refer to https://aka.ms/vscode-docker-python-debug
CMD ["/app/runserver.sh"]
