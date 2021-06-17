#!/bin/bash
set -x
action=$1
shift

case $action in
  web-prod)
    echo $GOOGLE_CREDENTIALS | base64 -d > /google_cred
    python manage.py migrate
    exec uwsgi /app/etc/uwsgi.ini "$@"
    ;;
  runserver)
    exec python manage.py runserver 0.0.0.0:8000
    ;;
  migrate)
    exec python manage.py migrate
    ;;
  makemigrations)
    exec python manage.py makemigrations
    ;;
  shell)
    exec python manage.py shell_plus
    ;;
  test)
    exec python manage.py test "$@"
    ;;
  celery)
    exec celery -A nft_market.celery worker --loglevel=DEBUG
    ;;
  *)
    exec $action "$@"
    ;;
esac
