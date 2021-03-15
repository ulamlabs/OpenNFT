FROM python:3.9.4-slim

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

RUN apt update -y && apt install -y git gcc wget
RUN pip install poetry
RUN poetry config virtualenvs.create false

EXPOSE 80

WORKDIR /app

COPY ./backend/pyproject.toml pyproject.toml
COPY ./backend/poetry.lock poetry.lock
RUN poetry install

ADD ./backend .
ADD ./contracts/assets ./nft_market/contracts/assets

RUN python manage.py collectstatic --no-input

RUN ls /app

ENTRYPOINT ["/app/etc/entrypoint.sh"]
CMD ["web-prod"]
