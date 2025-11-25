'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { useCallback, useState } from 'react';
import MediaPicker from './MediaPicker';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 underline hover:text-indigo-700',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    setShowMediaPicker(true);
  }, [editor]);

  const handleMediaSelect = useCallback((url: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
    setShowMediaPicker(false);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 text-sm font-semibold border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 text-sm italic border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 text-sm underline border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('underline') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Underline
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 text-sm line-through border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('strike') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Strike
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 text-sm font-bold border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          H3
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Bullet List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Ordered List
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Link & Image */}
        <button
          onClick={setLink}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('link') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Link
        </button>
        <button
          onClick={addImage}
          className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 bg-white"
          type="button"
        >
          Image
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Left
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Center
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Right
        </button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Other */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('blockquote') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Quote
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 ${
            editor.isActive('codeBlock') ? 'bg-indigo-100 text-indigo-700' : 'bg-white'
          }`}
          type="button"
        >
          Code
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-100 bg-white"
          type="button"
        >
          Divider
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Media Picker */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        preferredSize="large"
      />
    </div>
  );
}
