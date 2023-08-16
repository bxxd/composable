import "./App.css";
import { Workspace } from "./components/Workspace";
import Editor from "./ui/editor";

function App() {
  return (
    <>
      <div className="flex-3">
        <Editor />
      </div>
      <div className="flex-1">
        <Workspace />;
      </div>
    </>
  );
}
export default App;
