import { Editor } from "../components/editor";
import { Loading } from "../components/loading";
import { useRender } from "../components/pyodide-viz";
import root from "react-shadow";

// @ts-ignore
import debounce from "lodash.debounce";
import { useState, useMemo } from "react";

const DEFAULT_CODE = `
def index(request):
    return JsonResponse({"lol": "/1232134/"})

def lol(request):
    return JsonResponse({"lol": "/patrick/"})


urlpatterns = [
    path("", index),
    path("lol", lol),
]


browser_url = "/lol"
`.trim();

export const EditorWithPreview = ({}) => {
  const [rendering, setRendering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState("");

  const { renderDiagram } = useRender({
    onLoadStart: () => {
      setLoading(true);
    },
    onLoad: async () => {
      console.log("end");
      setLoading(false);

      const data = await renderDiagram(DEFAULT_CODE);
      setData(data);
    },
  });

  const onChange = useMemo(() => {
    return debounce(async (code: string) => {
      console.log("doing");
      setRendering(true);

      const data = await renderDiagram(code);

      setData(data);
      setRendering(false);
    }, 100);
  }, [renderDiagram]);

  console.log(data);

  return (
    <div className="grid grid-cols-2">
      <div className="overflow-y-scroll border-r">
        <Editor defaultCode={DEFAULT_CODE} onChange={onChange} />
      </div>

      <div className="relative">
        {(loading || rendering) && <Loading />}

        <root.div>
          <div dangerouslySetInnerHTML={{ __html: data }} />
        </root.div>
      </div>
    </div>
  );
};
