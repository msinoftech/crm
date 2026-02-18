"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function MenuBar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm font-medium ${
          editor.isActive("bold") ? "bg-slate-200" : "hover:bg-slate-100"
        }`}
      >
        Bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm ${
          editor.isActive("italic") ? "bg-slate-200" : "hover:bg-slate-100"
        }`}
      >
        Italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm ${
          editor.isActive("bulletList") ? "bg-slate-200" : "hover:bg-slate-100"
        }`}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm ${
          editor.isActive("orderedList") ? "bg-slate-200" : "hover:bg-slate-100"
        }`}
      >
        Numbered
      </button>
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // When parent clears value (e.g. after send), sync editor
  useEffect(() => {
    if (editor && value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.setContent("", false);
    }
  }, [value, editor]);

  return (
    <div
      className={`rounded-lg border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 ${className}`}
    >
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
