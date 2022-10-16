from django.db import models
from django.db import connection
from django.template import Template, Context
from django.http import HttpResponse, HttpResponseRedirect

TEMPLATE = """
<h1>Add new todo</h1>

<form action="/add-todo" method="post">
    <input type="text" name="text" />
    <button>Add</button>
</form>

<h1>My Todos</h1>

<ul>
   {% for todo in todos %}
   <li>{{ todo.text }}</li>
   {% endfor %}
</ul>
"""

import random

from pathlib import Path


class Todo(models.Model):
    text = models.TextField()

    class Meta:
        app_label = "abc"


def _create_db():
    # TODO: create db automatically from Django models
    with connection.cursor() as cursor:
        cursor.execute("""
          create table if not exists abc_todo (id INTEGER PRIMARY KEY, text STRING);
        """)

def add_todo(request):
    _create_db()

    # TODO: raise if it is not post

    text = request.POST["text"]

    todo = Todo.objects.create(text=text)

    return HttpResponseRedirect("/")

def todos(request):
    _create_db()

    todos = Todo.objects.all().order_by("-id")

    t = Template(TEMPLATE)
    c = Context({"todos": todos})
    return HttpResponse(t.render(c))

def clear(request):
    _create_db()

    Todo.objects.all().delete()

    return HttpResponse("Cleared all todos")


urlpatterns = [
    path("", todos),
    path("add-todo", add_todo),
    path("clear", clear),
]
