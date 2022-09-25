import { Editor } from "../components/editor";
import { Loading } from "../components/loading";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo, useEffect } from "react";
import { PyodideProvider, usePyodide } from "./pyodide";
import { POST_CODE, PRE_CODE } from "../lib/django";

const DEFAULT_CODE = `
# from django.db import models
# from django.db import connection
# from django.template import Template, Context
# from django.http import HttpResponse

# TEMPLATE = """
# <h1>My Todos</h1>

# <ul>
#    {% for todo in todos %}
#    <li>{{ todo.text }}</li>
#    {% endfor %}
# </ul>
# """

# import random

# from pathlib import Path

# def _create_db():
#     # TODO: create db automatically from Django models
#     with connection.cursor() as cursor:
#         cursor.execute("""
#           create table if not exists abc_todo (id INTEGER PRIMARY KEY, text STRING);
#         """)


# class Todo(models.Model):
#     text = models.TextField()

#     class Meta:
#         app_label = "abc"

# def index(request):
#     _create_db()

#     todo = Todo.objects.create(text=f"text {random.randint(0, 100)}")

#     return JsonResponse(
#         {"id": todo.id, "text": todo.text}
#     )

#     return JsonResponse({"id": todo.id, "text": todo.text})

# def todos(request):
#     _create_db()

#     todos = Todo.objects.all()

#     t = Template(TEMPLATE)
#     c = Context({"todos": todos})
#     return HttpResponse(t.render(c))

# def clear(request):
#     _create_db()

#     Todo.objects.all().delete()

#     return HttpResponse("Cleared all todos")


# urlpatterns = [
#     path("", index),
#     path("todos", todos),
#     path("clear", clear),
# ]
`.trim();

const getCode = (code: string, url: string) => {
  const urlCode = `\nbrowser_url = "${url}".replace("http://localhost:3000", "")\n`;

  return PRE_CODE + code + urlCode + POST_CODE;
};

const CodeEditor = ({
  url,
  onResult,
}: {
  url: string;
  onResult: (result: string) => void;
}) => {
  const { runPython } = usePyodide();
  const [code, setCode] = useState(DEFAULT_CODE);

  const run = useMemo(
    () =>
      debounce(async (code: string) => {
        const data = await runPython(getCode(code, url));

        if (data.result) {
          onResult(data.result);
        }
      }, 100),
    [runPython, url]
  );

  const onChange = (code: string) => {
    setCode(code);
  };

  useEffect(() => {
    run(code);
  }, [code, url]);

  return <Editor defaultCode={code} onChange={onChange} />;
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
        <iframe srcDoc={data} className="w-full h-full" />
      </div>
    </div>
  );
};

export const EditorWithPreview = ({}) => {
  const [url, setUrl] = useState("http://localhost:3000/todos");
  const [data, setData] = useState("");

  return (
    <PyodideProvider>
      <div className="grid grid-cols-2 flex-1">
        <div className="overflow-y-scroll border-r">
          <CodeEditor url={url} onResult={(data) => setData(data)} />
        </div>

        <div className="relative flex flex-col">
          <Preview url={url} onUrlChange={setUrl} data={data} />
        </div>
      </div>
    </PyodideProvider>
  );
};
