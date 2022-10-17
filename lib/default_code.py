import sys
import os


if "django.conf" in sys.modules:
    del sys.modules["django.conf"]

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'absurd.settings')

from django.core.management import execute_from_command_line

# execute_from_command_line(["manage.py", "makemigrations"])
execute_from_command_line(["manage.py", "migrate"])
