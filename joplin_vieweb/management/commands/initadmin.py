import logging
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.contrib.auth.models import BaseUserManager


class Command(BaseCommand):
    help = 'Add a admin/admin accoutn if no user exists.'

    def handle(self, *args, **options):
        User = get_user_model()
        users = User.objects.all()
        if users.count() == 0:
            username = "admin"
            email = "admin@admin.com"
            password = 'admin'
            logging.info('Creating account for %s (%s)' % (username, email))
            User.objects.create_superuser(username, email, password)
        else:
            logging.info('Admin accounts can only be initialized if no Accounts exist')