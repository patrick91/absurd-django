import { Editor } from "../components/editor";
import { Loading } from "../components/loading";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo, useEffect } from "react";
import { PyodideProvider, usePyodide } from "./pyodide";
import { POST_CODE, SETUP_CODE } from "../lib/django";

const DEFAULT_CODE = `
from django.db import models
from django.db import connection
from django.template import Template, Context
from django.http import HttpResponse

TEMPLATE = """
<h1>My Todos</h1>

<ul>
   {% for todo in todos %}
   <li>{{ todo.text }}</li>
   {% endfor %}
</ul>
"""

import random

from pathlib import Path

def _create_db():
    # TODO: create db automatically from Django models
    with connection.cursor() as cursor:
        cursor.execute("""
          create table if not exists abc_todo (id INTEGER PRIMARY KEY, text STRING);
        """)


class Todo(models.Model):
    text = models.TextField()

    class Meta:
        app_label = "abc"

def index(request):
    _create_db()

    todo = Todo.objects.create(text=f"text {random.randint(0, 100)}")

    return JsonResponse(
        {"id": todo.id, "text": todo.text}
    )

    return JsonResponse({"id": todo.id, "text": todo.text})

def todos(request):
    _create_db()

    todos = Todo.objects.all()

    t = Template(TEMPLATE)
    c = Context({"todos": todos})
    return HttpResponse(t.render(c))

def clear(request):
    _create_db()

    Todo.objects.all().delete()

    return HttpResponse("Cleared all todos")


urlpatterns = [
    path("", index),
    path("todos", todos),
    path("clear", clear),
]
`.trim();

const getCode = (code: string, url: string) => {
  const urlCode = `\nbrowser_url = "${url}".replace("http://localhost:3000", "")\n`;

  return SETUP_CODE + code + urlCode + POST_CODE;
};

const CodeEditor = ({
  url,
  onResult,
  code,
  setCode,
}: {
  url: string;
  onResult: (result: string) => void;
  code: string;
  setCode: (code: string) => void;
}) => {
  const { runPython } = usePyodide();

  const run = useMemo(
    () =>
      debounce(async (code: string) => {
        await runPython(getCode("", url));
        const data = await runPython(getCode(code, url));

        if (data.result) {
          onResult(data.result);
        }
      }, 100),
    [runPython, url]
  );

  // TODO:
  // have a separate thing here that saves the code and also 
  // debounces that (possibly more rarely...)

  const onChange = (code: string) => {
    console.log("second");
    setCode(code);
  };

  useEffect(() => {
    runPython(SETUP_CODE).then(() => {
      run(code);
    });
  }, [code, url]);

  return <Editor defaultCode={code} onChange={onChange} />;

  // There are really two big pieces here:
  // - Load the saved code at the very very beginning when the page loads
  // - Save the code occasionally so that when the whole page reloads it's there..
};

const Preview = ({
  data,
  url,
  onUrlChange,
}: {
  data: string;
  url: string;
  onUrlChange: (url: string) => void;
}) => {
  const { loading } = usePyodide();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      console.log(event.data);
    };

    window.addEventListener("message", listener, false);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  const html =
    data +
    `
      <script>
      document.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        window.parent.postMessage({
          type: "submit",
          method: e.target.method,
          data: Object.fromEntries(formData.entries())
        }, "*");
      })
      </script>
    `;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex p-4 border-b bg-green-200">
        <input
          className="w-full p-2 bg-transparent outline-none"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />

        <button className="text-3xl">🔃</button>
      </div>

      <div className="relative flex-1">
        {loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loading />
          </div>
        )}
        <iframe srcDoc={html} className="w-full h-full" />
      </div>
    </div>
  );
};

export const EditorWithPreview = ({}) => {
  const [url, setUrl] = useState("http://localhost:3000/todos");
  const [data, setData] = useState("");

  const [code, setCode] = useState(DEFAULT_CODE);

  return (
    <PyodideProvider setCode={setCode}>
      <div className="grid grid-cols-2 flex-1">
        <div className="overflow-y-scroll border-r">
          <CodeEditor url={url} onResult={(data) => setData(data)} code={code} setCode={setCode} />
        </div>

        <div className="relative flex flex-col">
          <Preview url={url} onUrlChange={setUrl} data={data} />
        </div>
      </div>
    </PyodideProvider>
  );
};
