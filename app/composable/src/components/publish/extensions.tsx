import StarterKit from "@tiptap/starter-kit";
// import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapLink from "@tiptap/extension-link";
// import TiptapImage from "@tiptap/extension-image";
// import TaskItem from "@tiptap/extension-task-item";
// import TaskList from "@tiptap/extension-task-list";
// import { Markdown } from "tiptap-markdown";
// import { InputRule } from "@tiptap/core";
// import Heading from "@tiptap/extension-heading";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Text from "@tiptap/extension-text";
import { Paragraph } from "@tiptap/extension-paragraph";
import HardBreak from "@tiptap/extension-hard-break";
import { Markdown } from "tiptap-markdown";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import DropCursor from "@tiptap/extension-dropcursor";

export const publishedExtensions = [
  StarterKit,
  // Text,
  // Paragraph,
  // HardBreak,
  Color,
  TextStyle,
  TiptapUnderline,
  TiptapLink,
  Markdown,
  HardBreak,
  // OrderedList,
  // ListItem,
];
