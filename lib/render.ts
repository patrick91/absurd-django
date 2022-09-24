const PRE_CODE = `
import diagrams

if not hasattr(diagrams, "DiOriginalDiagramagram"):
    diagrams.OriginalDiagram = diagrams.Diagram

import js

_diagram = None

class Diagram(diagrams.OriginalDiagram):
    def render(self):
      _diagram = str(self.dot).replace("/lib/python3.10/site-packages/resources/", "https://github.com/mingrammer/diagrams/raw/master/resources/")
        // js.renderDot(
        // )


    def __exit__(self, exc_type, exc_value, traceback):
        self.render()
        diagrams.setdiagram(None)

diagrams.Diagram = Diagram
`;

const POST_CODE = `_diagram`

export const renderDiagram = async (pyodide: any, pythonCode: string) => {
  // @ts-ignore
  return await pyodide.runPythonAsync(PRE_CODE + pythonCode);
};
