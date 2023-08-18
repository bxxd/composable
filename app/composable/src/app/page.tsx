import Workspace from "@/components/workspace";
import Tiptap from "@/components/editor";

export default function Home() {
  return (
    <main className="App container flex flex-col gap-4 max-w-[100ch]">
      <Tiptap />
    </main>
  );
}
