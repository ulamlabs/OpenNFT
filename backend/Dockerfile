FROM python:3.9.4-slim

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

RUN apt update -y && apt install -y git gcc wget
RUN pip install poetry
RUN poetry config virtualenvs.create false

EXPOSE 80

WORKDIR /app

COPY ./pyproject.toml pyproject.toml
COPY ./poetry.lock poetry.lock
RUN poetry install

ADD . .

RUN python manage.py collectstatic --no-input

ENTRYPOINT ["/app/etc/entrypoint.sh"]
CMD ["web-prod"]
