import { Editor } from "../components/editor";
import { Loading } from "../components/loading";
import { useRender } from "../components/pyodide-viz";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo, useEffect } from "react";

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

export const EditorWithPreview = ({}) => {
  const [rendering, setRendering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState(DEFAULT_CODE);

  const [data, setData] = useState("");

  const [currentUrl, setCurrentUrl] = useState("http://localhost:3000/todos");

  const { renderDiagram } = useRender({
    onLoadStart: () => {
      setLoading(true);
    },
    onLoad: async () => {
      console.log("end");
      setLoading(false);

      const data = await renderDiagram(DEFAULT_CODE, currentUrl);
      setData(data);
    },
  });

  const onChange = useMemo(() => {
    return debounce(async (code: string) => {
      setCode(code);
      setRendering(true);

      const data = await renderDiagram(code, currentUrl);

      setData(data);
      setRendering(false);
    }, 100);
  }, [renderDiagram, currentUrl]);

  const onClick = async () => {
    setRendering(true);

    const data = await renderDiagram(code, currentUrl);

    setData(data);
    setRendering(false);
  };

  useEffect(() => {
    if (rendering) {
      return;
    }
    setRendering(true);

    const data = renderDiagram(code, currentUrl).then(
      (data) => {
        setData(data);
        setRendering(false);
      },
      (error) => {
        console.error(error);
      }
    );
  }, [currentUrl]);

  return (
    <div className="grid grid-cols-2 flex-1">
      <div className="overflow-y-scroll border-r">
        <Editor defaultCode={DEFAULT_CODE} onChange={onChange} />
      </div>

      <div className="relative flex flex-col">
        {(loading || rendering) && <Loading />}

        <div className="flex p-4 border-b bg-green-200">
          <input
            className="w-full p-2 bg-transparent outline-none"
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
          />

          <button className="text-3xl" onClick={onClick}>
            🔃
          </button>
        </div>

        <iframe srcDoc={data} className="w-full h-full" />
      </div>
    </div>
  );
};
